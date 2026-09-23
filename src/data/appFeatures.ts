export interface AppFeatureDetail {
  id: string;
  name: string;
  tagline: string;
  category: string;
  version: string;
  developer: string;
  bundleSize: string;
  memoryEstimate: string;
  cacheSize: string;
  offlineCapable: boolean;
  features: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  permissions: Array<{
    name: string;
    description: string;
    status: 'granted' | 'optional' | 'restricted';
  }>;
  supportedFormats?: string[];
  systemIntegration: string[];
}

export const APP_FEATURE_DETAILS: Record<string, AppFeatureDetail> = {
  mobile: {
    id: 'mobile',
    name: 'iPhone Mirroring',
    tagline: 'Continuity & Sidecar Display System',
    category: 'Continuity & System',
    version: '2.0.0 (iOS 18.2 Bridge)',
    developer: 'Apple & Abhishek OS Engineering',
    bundleSize: '34.8 MB',
    memoryEstimate: '~42 MB',
    cacheSize: '18.4 MB',
    offlineCapable: true,
    features: [
      {
        title: 'iPhone Mirroring on Desktop',
        description: 'Interact with your iPhone 16 Pro directly from Mac with keyboard, mouse, and gesture pass-through.',
        icon: 'Smartphone',
      },
      {
        title: 'Sidecar / Mac on Mobile',
        description: 'Stream your Abhishek OS desktop in real-time onto your mobile screen with remote touch trackpad.',
        icon: 'ScreenShare',
      },
      {
        title: 'Dynamic Island & Live Activities',
        description: 'Real-time music playback, active timers, incoming phone calls, and navigation alerts.',
        icon: 'Radio',
      },
      {
        title: 'Live Camera & Photo Stream',
        description: 'Access live camera view or phone gallery photos and import them directly to Mac Desktop with one click.',
        icon: 'Camera',
      },
      {
        title: 'Universal Synced Clipboard',
        description: 'Copy text, code, or images on Mac and paste instantly on Mobile, and vice versa.',
        icon: 'Copy',
      },
      {
        title: 'AirDrop & Wi-Fi 6E Wireless Link',
        description: 'Ultra-low latency wireless bridge or high-speed Thunderbolt USB-C direct tethering.',
        icon: 'Wifi',
      },
    ],
    permissions: [
      { name: 'Camera & Microphone', description: 'Used for live camera streaming and FaceTime call emulation', status: 'granted' },
      { name: 'Local Network & AirPlay', description: 'Discovers nearby mobile devices on Wi-Fi and Bluetooth', status: 'granted' },
      { name: 'Clipboard Access', description: 'Universal cross-device clipboard synchronization', status: 'granted' },
      { name: 'Notification Center', description: 'Forwards phone push notifications to macOS notification banner', status: 'granted' },
    ],
    supportedFormats: ['AirPlay 2', 'Sidecar Display', 'HEIC', 'ProRAW', 'MP4', 'H.265'],
    systemIntegration: ['Dock Quick Actions', 'Menu Bar Status Item', 'Control Center Tile', 'Spotlight Search'],
  },
  finder: {
    id: 'finder',
    name: 'Finder',
    tagline: 'Virtual File System & Local Storage Navigator',
    category: 'System',
    version: '1.4.0',
    developer: 'Abhishek OS Core Team',
    bundleSize: '28.4 MB',
    memoryEstimate: '~35 MB',
    cacheSize: '12.8 MB',
    offlineCapable: true,
    features: [
      {
        title: 'Full Virtual File System (VFS)',
        description: 'Hierarchical file tree with directories, user home, desktop, downloads, trash, and documents.',
        icon: 'Folder',
      },
      {
        title: 'Local PC Drive Mounting',
        description: 'Directly mount folders from your physical computer via the File System Access API.',
        icon: 'HardDrive',
      },
      {
        title: 'Quick Look Previews',
        description: 'Instant preview of images, videos, audio waveforms, code files, and markdown with Spacebar.',
        icon: 'Maximize2',
      },
      {
        title: 'Clipboard Operations',
        description: 'Complete Cut, Copy, Paste, Duplicate, and Move to Trash with system keyboard shortcuts.',
        icon: 'Copy',
      },
    ],
    permissions: [
      { name: 'File System Storage', description: 'Store and retrieve virtual files in local persistence', status: 'granted' },
      { name: 'Drag & Drop Access', description: 'Allows dropping host operating system files into Finder', status: 'granted' },
    ],
    supportedFormats: ['txt', 'md', 'json', 'ts', 'js', 'py', 'png', 'jpg', 'mp3', 'mp4'],
    systemIntegration: ['Desktop Integration', 'Dock Pinning', 'Trash Management', 'Context Menu Handlers'],
  },
  camera: {
  id: 'camera',
  name: 'Camera',
  tagline: 'Capture Photos & Videos with Your Device Camera',
  category: 'System',
  version: '1.0.0',
  developer: 'Abhishek OS Core Team',
  bundleSize: '18.6 MB',
  memoryEstimate: '~42 MB',
  cacheSize: '256 MB',
  offlineCapable: true,

  features: [
    {
      title: 'Photo Capture',
      description:
        'Take high-quality photos using the front or rear camera and save them directly to Photos.',
      icon: 'Camera',
    },
    {
      title: 'Video Recording',
      description:
        'Record videos with live preview, recording timer, microphone control, and instant playback.',
      icon: 'Video',
    },
    {
      title: 'Front & Rear Camera',
      description:
        'Switch between available front and rear cameras using the camera flip control.',
      icon: 'RefreshCw',
    },
    {
      title: 'Zoom Controls',
      description:
        'Adjust camera zoom from 1x to 3x for closer framing and more flexible capture.',
      icon: 'ZoomIn',
    },
    {
      title: 'Timer Capture',
      description:
        'Use 3-second or 10-second countdown timers for hands-free photo capture.',
      icon: 'Timer',
    },
    {
      title: 'Flash Control',
      description:
        'Toggle flash assistance and visual flash feedback when capturing photos.',
      icon: 'Zap',
    },
    {
      title: 'Microphone Control',
      description:
        'Enable or disable microphone input while recording videos.',
      icon: 'Mic',
    },
    {
      title: 'Fullscreen Camera',
      description:
        'Expand the camera preview into fullscreen mode for an immersive capture experience.',
      icon: 'Maximize2',
    },
    {
      title: 'Recent Captures',
      description:
        'Quickly view recently captured photos and videos without leaving the Camera app.',
      icon: 'Image',
    },
    {
      title: 'Photos Integration',
      description:
        'Automatically save captured photos and videos to the ABHISHEK OS Photos library.',
      icon: 'Images',
    },
  ],

  permissions: [
    {
      name: 'Camera Access',
      description:
        'Allows ABHISHEK OS Camera to access the device camera for taking photos and recording videos.',
      status: 'granted',
    },
    {
      name: 'Microphone Access',
      description:
        'Allows the Camera app to capture audio when recording videos.',
      status: 'granted',
    },
    {
      name: 'Photo Library Storage',
      description:
        'Allows captured photos and videos to be saved to the local Photos library.',
      status: 'granted',
    },
  ],

  supportedFormats: [
    'jpg',
    'jpeg',
    'png',
    'webm',
    'mp4',
  ],

  systemIntegration: [
    'Photos Library Integration',
    'Camera Device Access',
    'Microphone Access',
    'Desktop Integration',
    'Dock Pinning',
    'Fullscreen Mode',
    'Local Media Storage',
  ],
},
  browser: {
    id: 'browser',
    name: 'Browser',
    tagline: 'Fast, Privacy-Focused Web Navigation',
    category: 'Productivity',
    version: '1.2.0',
    developer: 'Abhishek WebKit',
    bundleSize: '38.2 MB',
    memoryEstimate: '~78 MB',
    cacheSize: '42.1 MB',
    offlineCapable: true,
    features: [
      {
        title: 'Tabbed Browsing',
        description: 'Manage multiple concurrent browsing tabs with favicons, close buttons, and tab switching.',
        icon: 'Compass',
      },
      {
        title: 'Privacy Sandbox',
        description: 'Isolated iFrame execution with intelligent ad & tracker blocking.',
        icon: 'ShieldCheck',
      },
      {
        title: 'Curated Quick Bookmarks',
        description: 'One-click access to Google, GitHub, Wikipedia, TechCrunch, and Developer Docs.',
        icon: 'Bookmark',
      },
    ],
    permissions: [
      { name: 'Network Access', description: 'Load external web pages and search engine results', status: 'granted' },
      { name: 'Local History', description: 'Store browsing history and favorite bookmarks locally', status: 'granted' },
    ],
    supportedFormats: ['HTTPS', 'HTML5', 'CSS3', 'WebAssembly'],
    systemIntegration: ['Default Web Handler', 'Spotlight Search Web Fallback'],
  },
  codestudio: {
    id: 'codestudio',
    name: 'Code Studio',
    tagline: 'Professional IDE with Live Execution',
    category: 'Development',
    version: '2.1.0',
    developer: 'Abhishek Dev Tools',
    bundleSize: '46.1 MB',
    memoryEstimate: '~64 MB',
    cacheSize: '22.3 MB',
    offlineCapable: true,
    features: [
      {
        title: 'Multi-Language Syntax Highlighting',
        description: 'Crisp syntax rendering for TypeScript, JavaScript, Python, HTML, CSS, and Markdown.',
        icon: 'Code2',
      },
      {
        title: 'Live Sandbox Runner',
        description: 'Execute JavaScript/TypeScript code directly in-browser with live console output stream.',
        icon: 'Play',
      },
      {
        title: 'File Explorer & Tabs',
        description: 'Integrated project directory tree with multi-tab editor and unsaved status indicators.',
        icon: 'Folder',
      },
    ],
    permissions: [
      { name: 'Virtual File System', description: 'Read and write code projects to user folders', status: 'granted' },
    ],
    supportedFormats: ['ts', 'tsx', 'js', 'jsx', 'py', 'json', 'css', 'html', 'md'],
    systemIntegration: ['Open With Handler', 'Terminal Integration'],
  },
  music: {
    id: 'music',
    name: 'Music',
    tagline: 'Curated Audio Engine with Live Synthesizer',
    category: 'Media',
    version: '1.1.2',
    developer: 'Abhishek Audio Labs',
    bundleSize: '24.9 MB',
    memoryEstimate: '~32 MB',
    cacheSize: '15.6 MB',
    offlineCapable: true,
    features: [
      {
        title: 'Web Audio API Synth Engine',
        description: 'Real-time frequency generator capable of producing ambient, chillhop, synthwave, and Lo-Fi chords.',
        icon: 'Music',
      },
      {
        title: 'Dynamic Spectrum Visualizer',
        description: 'Smooth animated canvas visualizer reacting to audio harmonic frequencies.',
        icon: 'Activity',
      },
      {
        title: 'Custom Audio Import',
        description: 'Import MP3, WAV, and AAC files directly from local storage or computer disk.',
        icon: 'UploadCloud',
      },
    ],
    permissions: [
      { name: 'Audio Output', description: 'Play synthesizer harmonics and local audio tracks', status: 'granted' },
    ],
    supportedFormats: ['mp3', 'wav', 'aac', 'ogg', 'flac'],
    systemIntegration: ['Desktop Now Playing Widget', 'Control Center Audio Module', 'Menu Bar Music Pill'],
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    tagline: 'Unix Shell with Built-in Command Suite',
    category: 'Development',
    version: '1.5.0',
    developer: 'Abhishek OS Core',
    bundleSize: '19.2 MB',
    memoryEstimate: '~28 MB',
    cacheSize: '8.1 MB',
    offlineCapable: true,
    features: [
      {
        title: 'Interactive Command Suite',
        description: 'Includes ls, cat, cd, mkdir, touch, rm, clear, help, date, uname, and neofetch.',
        icon: 'Terminal',
      },
      {
        title: 'Neofetch System Diagnostics',
        description: 'ASCII system logo with detailed OS specs, uptime, RAM, and browser runtime information.',
        icon: 'Cpu',
      },
      {
        title: 'Command History & Autocomplete',
        description: 'Press Up/Down arrows to traverse past commands with Tab auto-completion.',
        icon: 'Clock',
      },
    ],
    permissions: [
      { name: 'VFS Read/Write', description: 'Execute virtual file system modifications through shell commands', status: 'granted' },
    ],
    systemIntegration: ['Spotlight Quick Commands', 'Code Studio Terminal Panel'],
  },
  tv: {
    id: 'tv',
    name: 'Abhishek TV',
    tagline: 'Cinematic Media & Video Streaming Hub',
    category: 'Media',
    version: '2.0.0',
    developer: 'Abhishek Media Group',
    bundleSize: '36.5 MB',
    memoryEstimate: '~52 MB',
    cacheSize: '29.0 MB',
    offlineCapable: false,
    features: [
      {
        title: 'Hero Showcase Player',
        description: 'High-definition video playback with trailer preview cards and category rows.',
        icon: 'Tv',
      },
      {
        title: 'Watchlist & History',
        description: 'Save favorite shows, movies, and video clips to your local watchlist.',
        icon: 'Bookmark',
      },
    ],
    permissions: [
      { name: 'Media Streaming', description: 'Stream video content over network', status: 'granted' },
    ],
    supportedFormats: ['mp4', 'webm', 'hls'],
    systemIntegration: ['Picture-in-Picture', 'Control Center Media Controls'],
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    tagline: 'System Preferences, Personalization & Hardware',
    category: 'System',
    version: '1.0.0',
    developer: 'Abhishek OS Core',
    bundleSize: '22.0 MB',
    memoryEstimate: '~30 MB',
    cacheSize: '6.4 MB',
    offlineCapable: true,
    features: [
      {
        title: 'Appearance & Themes',
        description: 'Dark, light, and auto appearance modes with 7 system accent colors.',
        icon: 'Palette',
      },
      {
        title: 'Live Wallpapers & Shaders',
        description: 'GPU-accelerated aurora, particle meshes, and cosmic starfield backgrounds.',
        icon: 'Image',
      },
      {
        title: 'Dock & Menu Bar Preferences',
        description: 'Configurable dock size, magnification, auto-hide, and position (bottom, left, right).',
        icon: 'Layout',
      },
      {
        title: 'Display & Night Shift',
        description: 'Adjust global brightness and enable warm ambient color temperature for nighttime use.',
        icon: 'Sun',
      },
    ],
    permissions: [
      { name: 'System Settings Access', description: 'Modify display, audio, user profile, and network parameters', status: 'granted' },
    ],
    systemIntegration: ['Menu Bar System Preferences', 'Dock Persistent Pin'],
  },
};

export const getAppFeatureDetails = (appId: string, fallbackName?: string): AppFeatureDetail => {
  if (APP_FEATURE_DETAILS[appId]) {
    return APP_FEATURE_DETAILS[appId];
  }
  return {
    id: appId,
    name: fallbackName || appId.charAt(0).toUpperCase() + appId.slice(1),
    tagline: 'Native Abhishek OS Application',
    category: 'Utility',
    version: '1.0.0',
    developer: 'Abhishek OS Developer',
    bundleSize: '16.4 MB',
    memoryEstimate: '~24 MB',
    cacheSize: '4.2 MB',
    offlineCapable: true,
    features: [
      {
        title: 'Seamless Desktop Integration',
        description: 'Runs in a responsive, draggable, resizable window frame with window controls.',
        icon: 'Layout',
      },
      {
        title: 'Local Persistence',
        description: 'State and preferences are preserved across app launches and system reboots.',
        icon: 'HardDrive',
      },
      {
        title: 'Sound & Animation Effects',
        description: 'Subtle tactile sound feedback and smooth spring animations.',
        icon: 'Sparkles',
      },
    ],
    permissions: [
      { name: 'Standard User Permissions', description: 'Runs in safe sandbox environment', status: 'granted' },
    ],
    systemIntegration: ['Dock Launcher', 'Spotlight Search', 'Mission Control'],
  };
};
