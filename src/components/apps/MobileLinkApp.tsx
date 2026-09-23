import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  ScreenShare,
  Cast,
  Camera,
  Image as ImageIcon,
  MessageCircle,
  FileText,
  Compass,
  Settings as SettingsIcon,
  Phone,
  Wifi,
  Battery,
  BatteryCharging,
  QrCode,
  RotateCw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Download,
  Send,
  Sparkles,
  ArrowLeft,
  X,
  Radio,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  UploadCloud,
  ChevronRight,
  Shield,
  Layers,
  Monitor,
  MousePointer,
  Keyboard,
  ExternalLink,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';
import { vfs } from '../../services/virtualFileSystem';

interface MobilePhoto {
  id: string;
  name: string;
  url: string;
  date: string;
  caption: string;
}

const SAMPLE_MOBILE_PHOTOS: MobilePhoto[] = [
  {
    id: 'mp-1',
    name: 'Sonoma-Sunset.jpg',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    date: 'Today, 6:45 PM',
    caption: 'Golden hour along the Pacific coast with Abhishek',
  },
  {
    id: 'mp-2',
    name: 'Tokyo-Nightline.jpg',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    date: 'Yesterday, 9:30 PM',
    caption: 'Shinjuku neon lights and cyber atmosphere',
  },
  {
    id: 'mp-3',
    name: 'Mountain-Summit.jpg',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    date: 'Sep 17, 2:15 PM',
    caption: 'Hiking peak panorama in the morning mist',
  },
  {
    id: 'mp-4',
    name: 'Minimal-Desk.jpg',
    url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    date: 'Sep 15, 11:00 AM',
    caption: 'Abhishek OS workspace & dual Studio Displays',
  },
];

interface MobileMessage {
  id: string;
  sender: 'abhishek' | 'contact';
  text: string;
  time: string;
}

export const MobileLinkApp: React.FC = () => {
  const {
    openApp,
    addNotification,
    currentWallpaper,
    windows,
    currentTrack,
    isPlayingMusic,
    togglePlayMusic,
    user,
  } = useOS();

  // Active viewing mode
  const [activeTab, setActiveTab] = useState<'mirror-phone' | 'mirror-mac' | 'pairing'>('mirror-phone');
  const [isConnected, setIsConnected] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [phoneAudioMuted, setPhoneAudioMuted] = useState(false);
  const [deviceModel, setDeviceModel] = useState("Abhishek's iPhone 16 Pro");
  const [copiedText, setCopiedText] = useState(false);

  // Phone Internal App Navigation
  const [phoneActiveApp, setPhoneActiveApp] = useState<'home' | 'camera' | 'photos' | 'messages' | 'notes' | 'safari' | 'phone' | 'settings'>('home');
  const [dynamicIslandExpanded, setDynamicIslandExpanded] = useState(false);

  // Camera App State
  const [isUsingWebcam, setIsUsingWebcam] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [cameraFilter, setCameraFilter] = useState<'vivid' | 'noir' | 'warm' | 'cool'>('vivid');
  const [cameraFlash, setCameraFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  // Photos App State
  const [photosList, setPhotosList] = useState<MobilePhoto[]>(SAMPLE_MOBILE_PHOTOS);
  const [selectedPhoto, setSelectedPhoto] = useState<MobilePhoto | null>(null);

  // Messages App State
  const [messages, setMessages] = useState<MobileMessage[]>([
    { id: 'm-1', sender: 'contact', text: 'Hey Abhishek! Are you on your Mac right now?', time: '9:41 AM' },
    { id: 'm-2', sender: 'abhishek', text: 'Yes, just testing the new iPhone Mirroring feature in Abhishek OS!', time: '9:42 AM' },
    { id: 'm-3', sender: 'contact', text: 'Awesome! Can you see the photos and dynamic island too?', time: '9:43 AM' },
  ]);
  const [newMessageText, setNewMessageText] = useState('');

  // Shared Clipboard State
  const [mobileClipboard, setMobileClipboard] = useState('https://github.com/abhishek/abhishek-os');

  // Sidecar / Remote Mac Trackpad State
  const [remoteCursorPos, setRemoteCursorPos] = useState({ x: 120, y: 80 });
  const [showRemoteKeyboard, setShowRemoteKeyboard] = useState(false);
  const [remoteTypedText, setRemoteTypedText] = useState('');

  // Clean up webcam stream on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  // Start / Stop Live Web Camera inside phone
  const toggleWebcam = async () => {
    if (isUsingWebcam) {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        setWebcamStream(null);
      }
      setIsUsingWebcam(false);
      sound.playClick();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing === 'front' ? 'user' : 'environment' },
          audio: false,
        });
        setWebcamStream(stream);
        setIsUsingWebcam(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        sound.playCameraShutter();
      } catch (err) {
        console.warn('Live webcam access not available, falling back to realistic simulation lens:', err);
        addNotification({
          appId: 'mobile',
          title: 'Live Camera Fallback',
          message: 'Using virtual high-definition iPhone lens simulation.',
          type: 'system',
        });
        setIsUsingWebcam(false);
      }
    }
  };

  // Capture Photo from Phone Camera
  const handleCapturePhoto = () => {
    sound.playCameraShutter();
    setCameraFlash(true);
    setTimeout(() => setCameraFlash(false), 200);

    const newPhoto: MobilePhoto = {
      id: `mp-${Date.now()}`,
      name: `IMG_${Math.floor(1000 + Math.random() * 9000)}.jpg`,
      url:
        cameraFacing === 'front'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      date: 'Just now',
      caption: 'Captured with iPhone 16 Pro 48MP Fusion Camera',
    };

    setPhotosList(prev => [newPhoto, ...prev]);

    // Save directly to Virtual File System on Desktop as well!
    vfs.createFile(
      '/Users/abhishek/Desktop',
      newPhoto.name,
      'image',
      newPhoto.caption,
      newPhoto.url
    );

    addNotification({
      appId: 'mobile',
      title: 'Photo Captured & Synced',
      message: `"${newPhoto.name}" saved to Phone Photos & synced to Mac Desktop.`,
      type: 'download',
    });
  };

  // Export any photo to Mac Desktop
  const handleExportPhotoToMac = (photo: MobilePhoto) => {
    sound.playClick();
    vfs.createFile(
      '/Users/abhishek/Desktop',
      photo.name,
      'image',
      photo.caption,
      photo.url
    );
    addNotification({
      appId: 'mobile',
      title: 'AirDrop Received',
      message: `"${photo.name}" from iPhone imported to Desktop.`,
      type: 'download',
    });
  };

  // Send Message in Phone
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim()) return;

    sound.playClick();
    const userMsg: MobileMessage = {
      id: `msg-${Date.now()}`,
      sender: 'abhishek',
      text: newMessageText.trim(),
      time: 'Just now',
    };
    setMessages(prev => [...prev, userMsg]);
    setNewMessageText('');

    // Simulate realistic reply from contact
    setTimeout(() => {
      sound.playMessage();
      const replyMsg: MobileMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'contact',
        text: 'Got it on my end! The cross-device connectivity is super seamless 🚀',
        time: 'Just now',
      };
      setMessages(prev => [...prev, replyMsg]);
      addNotification({
        appId: 'messages',
        title: 'Messages from iPhone',
        message: 'Simon Pickford: Got it on my end! Cross-device connectivity is seamless.',
        type: 'message',
      });
    }, 1400);
  };

  // Copy from Mac to Phone Clipboard
  const handlePasteMacClipboardToPhone = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMobileClipboard(text);
        sound.playClick();
        addNotification({
          appId: 'mobile',
          title: 'Universal Clipboard',
          message: 'Synced Mac clipboard to iPhone 16 Pro.',
          type: 'system',
        });
      }
    } catch {
      setMobileClipboard('Abhishek OS • Next-Gen Web Desktop Experience');
      sound.playClick();
    }
  };

  // Copy Phone Clipboard to Mac
  const handleCopyPhoneClipboardToMac = async () => {
    try {
      await navigator.clipboard.writeText(mobileClipboard);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
      sound.playClick();
      addNotification({
        appId: 'mobile',
        title: 'Universal Clipboard',
        message: 'Copied from iPhone to Mac clipboard.',
        type: 'system',
      });
    } catch {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white select-none overflow-hidden font-sans">
      {/* Top Application Navigation Bar */}
      <div className="h-14 px-4 bg-slate-900/90 border-b border-white/10 flex items-center justify-between backdrop-blur-xl shrink-0 z-30">
        {/* Device Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{deviceModel}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {isConnected ? 'Connected • AirPlay 5G' : 'Disconnected'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">iOS 18.2 Continuity & Sidecar Display</p>
          </div>
        </div>

        {/* Mode Switcher Segmented Control */}
        <div className="flex items-center p-1 rounded-xl bg-slate-800/90 border border-white/10 shadow-inner">
          <button
            onClick={() => {
              setActiveTab('mirror-phone');
              sound.playClick();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'mirror-phone'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iPhone on Mac</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('mirror-mac');
              sound.playClick();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'mirror-mac'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ScreenShare className="w-3.5 h-3.5" />
            <span>Mac on iPhone (Sidecar)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pairing');
              sound.playClick();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pairing'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Pair & Settings</span>
          </button>
        </div>

        {/* Quick Toolbar Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsLandscape(prev => !prev);
              sound.playClick();
            }}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              isLandscape
                ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title="Rotate Device Orientation"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setPhoneAudioMuted(prev => !prev);
              sound.playToggle(!phoneAudioMuted);
            }}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              phoneAudioMuted
                ? 'bg-rose-600/30 border-rose-500/50 text-rose-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title={phoneAudioMuted ? 'Unmute iPhone Audio' : 'Mute iPhone Audio'}
          >
            {phoneAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              setIsConnected(prev => !prev);
              sound.playToggle(!isConnected);
              addNotification({
                appId: 'mobile',
                title: isConnected ? 'Device Disconnected' : 'Device Connected',
                message: isConnected ? 'iPhone 16 Pro disconnected.' : 'iPhone 16 Pro connected via AirPlay 5G.',
                type: isConnected ? 'system' : 'update',
              });
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isConnected
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="flex-1 relative overflow-auto p-4 md:p-6 flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black">
        {/* MODE 1: IPHONE MIRRORING ON MAC */}
        {activeTab === 'mirror-phone' && (
          <div className="relative flex flex-col items-center">
            {/* Phone Hardware Mockup Shell */}
            <motion.div
              layout
              animate={{
                width: isLandscape ? 680 : 340,
                height: isLandscape ? 340 : 660,
              }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="relative rounded-[50px] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.15)] ring-4 ring-slate-800/80 overflow-hidden flex flex-col"
            >
              {/* Hardware Bezel & Screen Glass */}
              <div className="relative w-full h-full rounded-[42px] bg-slate-950 overflow-hidden border border-black/80 flex flex-col shadow-inner">
                {/* Dynamic Island Pill / Status Bar */}
                <div className="relative h-11 px-6 flex items-center justify-between z-40 shrink-0 text-white">
                  {/* Left: Clock */}
                  <span className="text-xs font-semibold tracking-tight">9:41</span>

                  {/* Center: Dynamic Island */}
                  <div
                    onClick={() => {
                      setDynamicIslandExpanded(prev => !prev);
                      sound.playClick();
                    }}
                    className={`absolute left-1/2 -translate-x-1/2 top-2 bg-black text-white rounded-full transition-all duration-300 flex items-center justify-between cursor-pointer border border-white/10 shadow-lg ${
                      dynamicIslandExpanded
                        ? 'w-72 h-16 px-4 py-2 rounded-3xl'
                        : 'w-24 h-7 px-2.5'
                    }`}
                  >
                    {dynamicIslandExpanded ? (
                      <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center text-white shadow">
                            <Radio className="w-4 h-4 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold truncate max-w-[120px] text-white">
                              {currentTrack.title}
                            </p>
                            <p className="text-[9px] text-slate-400 truncate max-w-[120px]">
                              {currentTrack.artist}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            togglePlayMusic();
                          }}
                          className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
                        >
                          {isPlayingMusic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                          <span className="text-[9px] font-bold text-amber-300">AirPlay</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700" />
                        <span className="text-[9px] font-bold text-sky-400">5G</span>
                      </>
                    )}
                  </div>

                  {/* Right: Signals & Battery */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Wifi className="w-3.5 h-3.5 text-white" />
                    <div className="flex items-center text-[10px] font-semibold text-emerald-400">
                      <span>98%</span>
                      <BatteryCharging className="w-4 h-4 ml-0.5 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Main Mirrored Screen Content Area */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                  {/* HOME SCREEN */}
                  {phoneActiveApp === 'home' && (
                    <div className="flex-1 p-5 flex flex-col justify-between bg-cover bg-center" style={{ backgroundImage: `url(${currentWallpaper.url})` }}>
                      {/* Dark overlay for readability */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs pointer-events-none" />

                      {/* Top Widgets (Clock & Weather) */}
                      <div className="relative z-10 space-y-3">
                        {/* Time Widget */}
                        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white">
                          <div className="text-[11px] font-semibold text-sky-300">Saturday, Sep 19</div>
                          <div className="text-3xl font-extrabold tracking-tight mt-0.5">09:41 AM</div>
                          <div className="text-[11px] text-slate-300 mt-0.5">Bengaluru • 26°C Partly Cloudy</div>
                        </div>
                      </div>

                      {/* App Grid */}
                      <div className="relative z-10 grid grid-cols-4 gap-3.5 my-auto py-2">
                        {/* Camera App */}
                        <button
                          onClick={() => {
                            setPhoneActiveApp('camera');
                            sound.playClick();
                          }}
                          className="flex flex-col items-center gap-1 group cursor-pointer"
                        >
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform border border-white/20">
                            <Camera className="w-6 h-6 text-sky-400" />
                          </div>
                          <span className="text-[10px] font-medium text-white/90 drop-shadow">Camera</span>
                        </button>

                        {/* Photos App */}
                        <button
                          onClick={() => {
                            setPhoneActiveApp('photos');
                            sound.playClick();
                          }}
                          className="flex flex-col items-center gap-1 group cursor-pointer"
                        >
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform border border-white/20">
                            <ImageIcon className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-[10px] font-medium text-white/90 drop-shadow">Photos</span>
                        </button>

                        {/* Messages App */}
                        <button
                          onClick={() => {
                            setPhoneActiveApp('messages');
                            sound.playClick();
                          }}
                          className="flex flex-col items-center gap-1 group cursor-pointer relative"
                        >
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform border border-white/20">
                            <MessageCircle className="w-6 h-6 text-white" />
                          </div>
                          <span className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-black">
                            1
                          </span>
                          <span className="text-[10px] font-medium text-white/90 drop-shadow">Messages</span>
                        </button>

                        {/* Notes / Clipboard App */}
                        <button
                          onClick={() => {
                            setPhoneActiveApp('notes');
                            sound.playClick();
                          }}
                          className="flex flex-col items-center gap-1 group cursor-pointer"
                        >
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform border border-white/20">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-[10px] font-medium text-white/90 drop-shadow">Notes Sync</span>
                        </button>

                        {/* Safari */}
                        <button
                          onClick={() => {
                            setPhoneActiveApp('safari');
                            sound.playClick();
                          }}
                          className="flex flex-col items-center gap-1 group cursor-pointer"
                        >
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform border border-white/20">
                            <Compass className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-[10px] font-medium text-white/90 drop-shadow">Safari</span>
                        </button>

                        {/* Phone */}
                        <button
                          onClick={() => {
                            setPhoneActiveApp('phone');
                            sound.playClick();
                          }}
                          className="flex flex-col items-center gap-1 group cursor-pointer"
                        >
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform border border-white/20">
                            <Phone className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-[10px] font-medium text-white/90 drop-shadow">Phone</span>
                        </button>

                        {/* Settings */}
                        <button
                          onClick={() => {
                            setPhoneActiveApp('settings');
                            sound.playClick();
                          }}
                          className="flex flex-col items-center gap-1 group cursor-pointer"
                        >
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-slate-600 to-slate-500 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform border border-white/20">
                            <SettingsIcon className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-[10px] font-medium text-white/90 drop-shadow">Settings</span>
                        </button>

                        {/* AirDrop Dropzone */}
                        <button
                          onClick={() => {
                            setActiveTab('pairing');
                            sound.playClick();
                          }}
                          className="flex flex-col items-center gap-1 group cursor-pointer"
                        >
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform border border-white/20">
                            <Cast className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-[10px] font-medium text-white/90 drop-shadow">AirDrop</span>
                        </button>
                      </div>

                      {/* Bottom Dock on Mobile */}
                      <div className="relative z-10 p-2.5 rounded-3xl bg-white/20 backdrop-blur-2xl border border-white/25 flex items-center justify-around">
                        <button
                          onClick={() => setPhoneActiveApp('phone')}
                          className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setPhoneActiveApp('safari')}
                          className="w-11 h-11 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow"
                        >
                          <Compass className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setPhoneActiveApp('messages')}
                          className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setPhoneActiveApp('notes')}
                          className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CAMERA APP */}
                  {phoneActiveApp === 'camera' && (
                    <div className="flex-1 bg-black flex flex-col justify-between p-3 relative">
                      {/* Camera Flash effect */}
                      {cameraFlash && <div className="absolute inset-0 bg-white z-50 pointer-events-none" />}

                      {/* Top Camera Controls */}
                      <div className="flex items-center justify-between text-white py-1 px-2 z-10">
                        <button
                          onClick={() => setPhoneActiveApp('home')}
                          className="p-1 rounded-full bg-white/20 hover:bg-white/30"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={toggleWebcam}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              isUsingWebcam
                                ? 'bg-rose-500/30 border-rose-400 text-rose-300'
                                : 'bg-sky-500/30 border-sky-400 text-sky-300'
                            }`}
                          >
                            {isUsingWebcam ? 'Disable Live Camera' : 'Enable Live Camera'}
                          </button>
                        </div>
                      </div>

                      {/* Viewfinder Stage */}
                      <div className="flex-1 my-2 rounded-2xl overflow-hidden relative bg-slate-900 border border-white/10 flex items-center justify-center">
                        {isUsingWebcam ? (
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full relative">
                            <img
                              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
                              alt="Scenic Viewfinder"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center p-4 text-center">
                              <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-400/80 animate-spin flex items-center justify-center mb-2">
                                <Sparkles className="w-6 h-6 text-amber-400" />
                              </div>
                              <span className="text-xs font-bold text-white drop-shadow">
                                48MP Fusion Lens • 2x Optical
                              </span>
                              <span className="text-[10px] text-amber-300 mt-1 drop-shadow">
                                Ready to Capture to Mac Desktop
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Shutter Controls */}
                      <div className="flex items-center justify-around py-3">
                        {/* Gallery thumbnail shortcut */}
                        <button
                          onClick={() => setPhoneActiveApp('photos')}
                          className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/40 shadow cursor-pointer"
                        >
                          <img
                            src={photosList[0]?.url || SAMPLE_MOBILE_PHOTOS[0].url}
                            alt="Last captured"
                            className="w-full h-full object-cover"
                          />
                        </button>

                        {/* Capture Shutter Button */}
                        <button
                          onClick={handleCapturePhoto}
                          className="w-16 h-16 rounded-full border-4 border-white p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                        >
                          <div className="w-full h-full rounded-full bg-white shadow-lg" />
                        </button>

                        {/* Switch Front/Rear */}
                        <button
                          onClick={() => {
                            setCameraFacing(prev => (prev === 'front' ? 'back' : 'front'));
                            sound.playClick();
                          }}
                          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
                        >
                          <RotateCw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PHOTOS APP */}
                  {phoneActiveApp === 'photos' && (
                    <div className="flex-1 bg-slate-950 flex flex-col text-white p-3 overflow-y-auto">
                      {/* Photos Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPhoto(null);
                              setPhoneActiveApp('home');
                            }}
                            className="p-1 rounded-full hover:bg-white/15"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold">iPhone Photos</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{photosList.length} Items</span>
                      </div>

                      {/* Photo Grid */}
                      <div className="grid grid-cols-2 gap-2 mt-3 flex-1 overflow-y-auto">
                        {photosList.map(photo => (
                          <div
                            key={photo.id}
                            className="group relative rounded-xl overflow-hidden aspect-square border border-white/10 cursor-pointer"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <img src={photo.url} alt={photo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                              <p className="text-[10px] font-bold text-white truncate">{photo.name}</p>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleExportPhotoToMac(photo);
                                }}
                                className="mt-1 w-full py-1 rounded bg-sky-500 hover:bg-sky-400 text-white text-[9px] font-semibold flex items-center justify-center gap-1 shadow"
                              >
                                <Download className="w-3 h-3" />
                                <span>Save to Mac</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Modal for viewing single selected photo */}
                      {selectedPhoto && (
                        <div className="absolute inset-0 bg-black/95 z-50 p-4 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setSelectedPhoto(null)}
                              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-bold truncate max-w-[180px]">{selectedPhoto.name}</span>
                            <div className="w-6" />
                          </div>

                          <div className="flex-1 my-2 flex items-center justify-center overflow-hidden">
                            <img src={selectedPhoto.url} alt={selectedPhoto.name} className="max-w-full max-h-full rounded-lg object-contain shadow-2xl" />
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs text-slate-300 text-center">{selectedPhoto.caption}</p>
                            <button
                              onClick={() => handleExportPhotoToMac(selectedPhoto)}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              <span>Import to Abhishek OS Desktop</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MESSAGES APP */}
                  {phoneActiveApp === 'messages' && (
                    <div className="flex-1 bg-slate-900 flex flex-col justify-between p-3 text-white">
                      {/* Messages Header */}
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                        <button onClick={() => setPhoneActiveApp('home')} className="p-1 rounded-full hover:bg-white/15">
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold">
                          SP
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-tight">Simon Pickford</p>
                          <p className="text-[9px] text-emerald-400">Online • iPhone</p>
                        </div>
                      </div>

                      {/* Chat Bubbles */}
                      <div className="flex-1 my-2 overflow-y-auto space-y-2 pr-1">
                        {messages.map(m => (
                          <div
                            key={m.id}
                            className={`flex flex-col ${m.sender === 'abhishek' ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs font-medium ${
                                m.sender === 'abhishek'
                                  ? 'bg-blue-600 text-white rounded-br-xs'
                                  : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-white/10'
                              }`}
                            >
                              {m.text}
                            </div>
                            <span className="text-[8px] text-slate-400 px-1 mt-0.5">{m.time}</span>
                          </div>
                        ))}
                      </div>

                      {/* Message Input Field */}
                      <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <input
                          type="text"
                          value={newMessageText}
                          onChange={e => setNewMessageText(e.target.value)}
                          placeholder="iMessage to iPhone..."
                          className="flex-1 px-3 py-1.5 rounded-full bg-slate-800 text-xs text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={!newMessageText.trim()}
                          className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center justify-center text-white cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* NOTES & SHARED CLIPBOARD */}
                  {phoneActiveApp === 'notes' && (
                    <div className="flex-1 bg-slate-950 flex flex-col justify-between p-3.5 text-white">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                        <button onClick={() => setPhoneActiveApp('home')} className="p-1 rounded-full hover:bg-white/15">
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold">Universal Clipboard & Notes</span>
                      </div>

                      <div className="flex-1 my-3 space-y-3 overflow-y-auto">
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                          <div className="flex items-center justify-between text-amber-300 text-xs font-bold mb-1">
                            <span>Phone Active Clipboard</span>
                            <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full">Synced</span>
                          </div>
                          <textarea
                            value={mobileClipboard}
                            onChange={e => setMobileClipboard(e.target.value)}
                            className="w-full h-24 p-2 rounded-xl bg-slate-900 text-xs text-slate-100 border border-white/10 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none font-mono"
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={handleCopyPhoneClipboardToMac}
                              className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow"
                            >
                              {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedText ? 'Copied to Mac!' : 'Push to Mac Clipboard'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30">
                          <div className="flex items-center justify-between text-sky-300 text-xs font-bold mb-1">
                            <span>Pull from Mac Clipboard</span>
                            <button
                              onClick={handlePasteMacClipboardToPhone}
                              className="text-[10px] bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                            >
                              Sync Now
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Whatever you copy on Abhishek OS (text, URL, terminal command) can be instantly synced to this iPhone.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SAFARI APP */}
                  {phoneActiveApp === 'safari' && (
                    <div className="flex-1 bg-slate-900 flex flex-col justify-between text-white">
                      {/* URL Bar */}
                      <div className="p-2.5 bg-slate-800 border-b border-white/10 flex items-center gap-2">
                        <button onClick={() => setPhoneActiveApp('home')} className="p-1 rounded hover:bg-white/10">
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex-1 px-3 py-1 rounded-full bg-slate-950 border border-white/10 text-[11px] text-slate-300 flex items-center justify-between truncate">
                          <span>apple.com/iphone-16-pro</span>
                          <Shield className="w-3 h-3 text-emerald-400 ml-1 shrink-0" />
                        </div>
                      </div>

                      {/* Web View Placeholder */}
                      <div className="flex-1 p-4 flex flex-col items-center justify-center text-center space-y-2 bg-gradient-to-b from-slate-900 to-black">
                        <Compass className="w-12 h-12 text-blue-400 animate-pulse" />
                        <h4 className="text-sm font-bold text-white">Safari Web Mobile</h4>
                        <p className="text-xs text-slate-400 max-w-[220px]">
                          Fast, sandboxed browsing synced with your Mac iCloud Keychain and tabs.
                        </p>
                        <button
                          onClick={() => openApp('browser')}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open in Mac Browser</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PHONE / KEYPAD APP */}
                  {phoneActiveApp === 'phone' && (
                    <div className="flex-1 bg-slate-950 flex flex-col justify-between p-4 text-white">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                        <button onClick={() => setPhoneActiveApp('home')} className="p-1 rounded hover:bg-white/15">
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold">Keypad</span>
                      </div>

                      {/* Number Display */}
                      <div className="text-center py-2">
                        <div className="text-2xl font-bold tracking-wider text-white">+91 98765 43210</div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">Carrier: Abhishek HyperFiber VoLTE</div>
                      </div>

                      {/* Dial Keys */}
                      <div className="grid grid-cols-3 gap-3 px-3 my-auto">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(key => (
                          <button
                            key={key}
                            onClick={() => sound.playClick()}
                            className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 transition-transform flex items-center justify-center text-base font-semibold mx-auto cursor-pointer shadow"
                          >
                            {key}
                          </button>
                        ))}
                      </div>

                      {/* Call Action */}
                      <div className="flex justify-center py-2">
                        <button
                          onClick={() => {
                            sound.playToggle(true);
                            addNotification({
                              appId: 'mobile',
                              title: 'Outgoing Call',
                              message: 'Dialing +91 98765 43210 from iPhone 16 Pro...',
                              type: 'system',
                            });
                          }}
                          className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-white shadow-lg cursor-pointer"
                        >
                          <Phone className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SETTINGS APP */}
                  {phoneActiveApp === 'settings' && (
                    <div className="flex-1 bg-slate-950 flex flex-col p-4 text-white overflow-y-auto">
                      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                        <button onClick={() => setPhoneActiveApp('home')} className="p-1 rounded hover:bg-white/15">
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold">About This iPhone</span>
                      </div>

                      <div className="space-y-3 mt-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Device Name</span>
                            <span className="font-semibold text-white">{deviceModel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">iOS Version</span>
                            <span className="font-semibold text-sky-400">18.2 (22C150)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Model Identifier</span>
                            <span className="font-semibold text-white">iPhone 17,2</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Storage</span>
                            <span className="font-semibold text-emerald-400">184.2 GB / 256 GB Free</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Battery Health</span>
                            <span className="font-semibold text-emerald-400">100% (Normal)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Continuity Bridge</span>
                            <span className="font-semibold text-purple-400">Active (AirPlay 2)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom iOS Home Bar (Swipe / Click to go Home) */}
                <div
                  onClick={() => {
                    setPhoneActiveApp('home');
                    sound.playClick();
                  }}
                  className="h-6 flex items-center justify-center shrink-0 cursor-pointer group"
                  title="Click or swipe to go to Home Screen"
                >
                  <div className="w-32 h-1 rounded-full bg-white/40 group-hover:bg-white/80 transition-colors" />
                </div>
              </div>
            </motion.div>

            {/* Quick helper tip under the phone */}
            <p className="text-[11px] text-slate-400 mt-4 text-center">
              💡 Drag & drop files onto the phone to AirDrop • Click the Home bar at the bottom to return Home
            </p>
          </div>
        )}

        {/* MODE 2: DESKTOP SCREEN ON MOBILE (SIDECAR / REMOTE MAC) */}
        {activeTab === 'mirror-mac' && (
          <div className="relative flex flex-col items-center max-w-2xl w-full">
            <motion.div
              layout
              animate={{
                width: isLandscape ? 640 : 360,
                height: isLandscape ? 360 : 640,
              }}
              className="relative rounded-[46px] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl ring-4 ring-slate-800 flex flex-col overflow-hidden"
            >
              <div className="relative w-full h-full rounded-[38px] bg-slate-950 overflow-hidden border border-black/80 flex flex-col">
                {/* Mobile Top Dynamic Island */}
                <div className="h-8 px-5 flex items-center justify-between z-30 shrink-0 bg-black/40 text-white text-[10px]">
                  <span className="font-semibold">9:41</span>
                  <div className="w-18 h-4 rounded-full bg-black border border-white/20 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-sky-400">Sidecar Remote</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>94%</span>
                    <Battery className="w-3 h-3 text-emerald-400" />
                  </div>
                </div>

                {/* Streamed Mac Desktop Canvas Preview */}
                <div
                  className="flex-1 relative overflow-hidden bg-cover bg-center cursor-crosshair"
                  style={{ backgroundImage: `url(${currentWallpaper.url})` }}
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setRemoteCursorPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                    sound.playClick();
                  }}
                >
                  {/* Miniature macOS Top Menu Bar */}
                  <div className="h-4 px-2 bg-black/40 backdrop-blur-md flex items-center justify-between text-[8px] text-white border-b border-white/10">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span></span>
                      <span>Finder</span>
                      <span className="text-white/60">File</span>
                      <span className="text-white/60">Edit</span>
                      <span className="text-white/60">View</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>9:41 AM</span>
                    </div>
                  </div>

                  {/* Streamed Windows Preview */}
                  <div className="p-3 space-y-2">
                    {windows.slice(0, 2).map((w, idx) => (
                      <div
                        key={w.id}
                        className="rounded-lg bg-slate-900/90 border border-white/20 shadow-xl p-2 text-white max-w-[200px]"
                        style={{ transform: `translate(${idx * 15}px, ${idx * 15}px)` }}
                      >
                        <div className="flex items-center gap-1 border-b border-white/10 pb-1 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[9px] font-bold ml-1 truncate">{w.title}</span>
                        </div>
                        <p className="text-[8px] text-slate-400">Streamed from Abhishek OS Host</p>
                      </div>
                    ))}
                  </div>

                  {/* Remote Cursor Pointer */}
                  <motion.div
                    animate={{ x: remoteCursorPos.x - 6, y: remoteCursorPos.y - 6 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="absolute pointer-events-none z-50 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                  >
                    <MousePointer className="w-4 h-4 fill-sky-400" />
                  </motion.div>

                  {/* Miniature Mac Dock at Bottom of Phone */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-xl bg-white/20 backdrop-blur-xl border border-white/25 flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openApp('finder');
                        sound.playClick();
                      }}
                      className="w-5 h-5 rounded-md bg-sky-500 flex items-center justify-center text-white"
                      title="Open Finder on Mac"
                    >
                      <Layers className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openApp('browser');
                        sound.playClick();
                      }}
                      className="w-5 h-5 rounded-md bg-blue-500 flex items-center justify-center text-white"
                      title="Open Browser on Mac"
                    >
                      <Compass className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openApp('notes');
                        sound.playClick();
                      }}
                      className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center text-white"
                      title="Open Notes on Mac"
                    >
                      <FileText className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openApp('terminal');
                        sound.playClick();
                      }}
                      className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center text-white"
                      title="Open Terminal on Mac"
                    >
                      <Monitor className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Remote Touch Trackpad Bar */}
                <div className="h-14 bg-slate-900 border-t border-white/10 p-2 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <MousePointer className="w-3.5 h-3.5 text-sky-400" />
                    <span>Touch Trackpad Active</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        addNotification({
                          appId: 'mobile',
                          title: 'Remote Click Sent',
                          message: 'Sent Left Click from iPhone trackpad.',
                          type: 'system',
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold"
                    >
                      Left Click
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        addNotification({
                          appId: 'mobile',
                          title: 'Remote Right-Click Sent',
                          message: 'Context menu triggered from iPhone.',
                          type: 'system',
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold"
                    >
                      Right Click
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <p className="text-[11px] text-slate-400 mt-4 text-center">
              💻 Abhishek OS desktop rendered in real-time on iPhone • Tap anywhere on the mobile screen to control the remote pointer
            </p>
          </div>
        )}

        {/* MODE 3: PAIRING, QR CODE & ADVANCED CONTINUITY SETTINGS */}
        {activeTab === 'pairing' && (
          <div className="max-w-xl w-full bg-slate-900/90 rounded-3xl p-6 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold">Connect Your Real Smartphone</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pair iPhone, iPad, or Android device using AirPlay Direct or Wi-Fi 6E
                </p>
              </div>
              <span className="p-2 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <QrCode className="w-6 h-6" />
              </span>
            </div>

            {/* QR Code & Pairing Instructions */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-950/70 border border-white/10">
              <div className="w-36 h-36 p-2 rounded-2xl bg-white flex items-center justify-center shadow-lg shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950">
                  <path
                    fill="currentColor"
                    d="M10 10h30v30h-30zM15 15v20h20v-20zM22 22h6v6h-6zM60 10h30v30h-30zM65 15v20h20v-20zM72 22h6v6h-6zM10 60h30v30h-30zM15 65v20h20v-20zM22 72h6v6h-6zM60 60h10v10h-10zM80 60h10v10h-10zM70 70h10v10h-10zM60 80h10v10h-10zM80 80h10v10h-10zM45 10h10v10h-10zM45 45h10v10h-10zM45 80h10v10h-10zM10 45h10v10h-10zM80 45h10v10h-10z"
                  />
                </svg>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-bold text-white text-sm">Scan with your Camera</p>
                <p className="text-slate-300 leading-relaxed">
                  Open the Camera app on your iPhone or Android and point it at this QR code to initiate high-speed AirPlay mirroring.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      sound.playClick();
                      addNotification({
                        appId: 'mobile',
                        title: 'Pairing Link Copied',
                        message: 'Direct mobile pairing URL copied to clipboard.',
                        type: 'system',
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Pairing Link</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Continuity Features Switches */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Continuity Features</h4>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-white/10">
                <div>
                  <p className="text-xs font-bold text-white">Universal Clipboard</p>
                  <p className="text-[11px] text-slate-400">Copy on Mac, paste seamlessly on Phone</p>
                </div>
                <div className="w-9 h-5 rounded-full bg-indigo-600 p-0.5 cursor-pointer flex justify-end">
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-white/10">
                <div>
                  <p className="text-xs font-bold text-white">iPhone Notifications on Mac</p>
                  <p className="text-[11px] text-slate-400">Forward mobile SMS, calls, and app alerts to macOS banners</p>
                </div>
                <div className="w-9 h-5 rounded-full bg-indigo-600 p-0.5 cursor-pointer flex justify-end">
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-white/10">
                <div>
                  <p className="text-xs font-bold text-white">Instant Personal Hotspot</p>
                  <p className="text-[11px] text-slate-400">Auto-connect to 5G Ultra Wideband when offline</p>
                </div>
                <div className="w-9 h-5 rounded-full bg-indigo-600 p-0.5 cursor-pointer flex justify-end">
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
