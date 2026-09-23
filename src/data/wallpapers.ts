import { Wallpaper } from '../types/desktop';

export const WALLPAPERS: Wallpaper[] = [
  // Abhishek Collection (Signature & matching reference images!)
  {
    id: 'abhishek-canyon',
    name: 'Abhishek Canyon Silk',
    category: 'abhishek',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=400&auto=format&fit=crop',
    themePreference: 'dark',
  },
  {
    id: 'abhishek-horizon',
    name: 'Abhishek Sunrise Peaks',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=2560&auto=format&fit=crop',
    category: 'abhishek',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop',
    themePreference: 'light',
  },
  {
    id: 'abhishek-dark-silk',
    name: 'Abhishek Midnight Flow',
    category: 'abhishek',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
    themePreference: 'dark',
  },
  {
    id: 'abhishek-big-sur',
    name: 'Abhishek Vibrant Waves',
    category: 'abhishek',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=400&auto=format&fit=crop',
    themePreference: 'light',
  },

  // Live Wallpapers
  {
    id: 'live-aurora',
    name: 'Live Aurora Borealis',
    category: 'abstract',
    url: 'live:aurora',
    thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=400&auto=format&fit=crop',
    isLive: true,
    liveType: 'aurora',
    themePreference: 'dark',
  },
  {
    id: 'live-stars',
    name: 'Live Cosmic Starfield',
    category: 'abstract',
    url: 'live:stars',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=400&auto=format&fit=crop',
    isLive: true,
    liveType: 'stars',
    themePreference: 'dark',
  },
  {
    id: 'live-particles',
    name: 'Live Floating Nebula',
    category: 'abstract',
    url: 'live:particles',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&auto=format&fit=crop',
    isLive: true,
    liveType: 'particles',
    themePreference: 'dark',
  },
  {
    id: 'live-gradient',
    name: 'Live Fluid Mesh',
    category: 'abstract',
    url: 'live:gradient',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop',
    isLive: true,
    liveType: 'gradient',
    themePreference: 'dark',
  },

  // Abstract
  {
    id: 'abstract-neon-glass',
    name: 'Liquid Glass',
    category: 'abstract',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=400&auto=format&fit=crop',
    themePreference: 'dark',
  },
  {
    id: 'abstract-purple-wave',
    name: 'Purple Wave',
    category: 'abstract',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
    themePreference: 'dark',
  },
  {
    id: 'abstract-blue-horizon',
    name: 'Blue Horizon',
    category: 'abstract',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop',
    themePreference: 'light',
  },

  // Nature
  {
    id: 'nature-mountains',
    name: 'Alpine Ridge',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400&auto=format&fit=crop',
    themePreference: 'dark',
  },
  {
    id: 'nature-forest',
    name: 'Misty Pine Forest',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=400&auto=format&fit=crop',
    themePreference: 'dark',
  },
  {
    id: 'nature-ocean',
    name: 'Pacific Azure',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=400&auto=format&fit=crop',
    themePreference: 'light',
  },

  // City
  {
    id: 'city-tokyo',
    name: 'Tokyo Rain',
    category: 'city',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=400&auto=format&fit=crop',
    themePreference: 'dark',
  },
  {
    id: 'city-mumbai',
    name: 'Mumbai Sea Link',
    category: 'city',
    url: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=400&auto=format&fit=crop',
    themePreference: 'dark',
  },
  {
    id: 'city-ny',
    name: 'Manhattan Twilight',
    category: 'city',
    url: 'https://images.unsplash.com/photo-1496868834840-5f4c98840aaa?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1496868834840-5f4c98840aaa?q=80&w=400&auto=format&fit=crop',
    themePreference: 'dark',
  },

  // Minimal
  {
    id: 'minimal-dark',
    name: 'Pure Obsidian',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
    themePreference: 'dark',
  },
  {
    id: 'minimal-soft-blue',
    name: 'Soft Studio Gradient',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&auto=format&fit=crop',
    themePreference: 'dark',
  }
];

export const DEFAULT_WALLPAPER = WALLPAPERS[0]; // canyon silk from reference #1!
