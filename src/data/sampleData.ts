import { VirtualFile, AudioTrack } from '../types/desktop';

export const INITIAL_FILES: VirtualFile[] = [
  // Documents folder (Matches Reference Image #1 & #4)
  {
    id: 'doc-aerial-01',
    name: 'aerial-01',
    path: '/Users/abhishek/Documents',
    size: 48200000,
    type: 'video',
    extension: 'mp4',
    previewUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=800&auto=format&fit=crop',
    createdAt: '2026-09-18T14:30:00Z',
    updatedAt: '2026-09-18T14:30:00Z',
    isFavorite: true,
  },
  {
    id: 'doc-canyon',
    name: 'canyon',
    path: '/Users/abhishek/Documents',
    size: 6400000,
    type: 'image',
    extension: 'jpg',
    previewUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=800&auto=format&fit=crop',
    createdAt: '2026-09-17T09:15:00Z',
    updatedAt: '2026-09-17T09:15:00Z',
  },
  {
    id: 'doc-final-soundtrack',
    name: 'final soundtrack',
    path: '/Users/abhishek/Documents',
    size: 12800000,
    type: 'audio',
    extension: 'wav',
    previewUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
    waveform: [15, 28, 45, 60, 85, 95, 70, 80, 100, 75, 65, 88, 92, 50, 42, 60, 78, 85, 90, 72, 55, 40, 30, 20],
    createdAt: '2026-09-19T02:00:00Z',
    updatedAt: '2026-09-19T02:00:00Z',
    isFavorite: true,
  },
  {
    id: 'doc-index-html',
    name: 'index.html',
    path: '/Users/abhishek/Documents',
    size: 2450,
    type: 'code',
    extension: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Abhishek OS Engine</title>
  <style>
    body { background: #0b0f19; color: #38bdf8; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; }
  </style>
</head>
<body>
  <h1>Welcome to Abhishek OS</h1>
</body>
</html>`,
    createdAt: '2026-09-18T18:22:00Z',
    updatedAt: '2026-09-18T18:22:00Z',
  },
  {
    id: 'doc-jellyfish',
    name: 'jellyfish',
    path: '/Users/abhishek/Documents',
    size: 8900000,
    type: 'image',
    extension: 'psd',
    previewUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop',
    createdAt: '2026-09-15T11:40:00Z',
    updatedAt: '2026-09-15T11:40:00Z',
  },
  {
    id: 'doc-project-files',
    name: 'project files',
    path: '/Users/abhishek/Documents',
    size: 154000000,
    type: 'folder',
    previewUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop',
    createdAt: '2026-09-16T10:00:00Z',
    updatedAt: '2026-09-19T05:00:00Z',
  },
  {
    id: 'doc-mobile-project',
    name: 'project-concept',
    path: '/Users/abhishek/Documents',
    size: 14200000,
    type: 'image',
    extension: 'png',
    previewUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
    createdAt: '2026-09-18T16:00:00Z',
    updatedAt: '2026-09-18T16:00:00Z',
  },

  // Desktop files
 
  // {
  //   id: 'desktop-brand-guide',
  //   name: 'Abhishek-OS-Brand.pdf',
  //   path: '/Users/abhishek/Desktop',
  //   size: 3400000,
  //   type: 'document',
  //   extension: 'pdf',
  //   content: 'Abhishek OS Official Brand Guidelines & Design Tokens',
  //   createdAt: '2026-09-17T12:00:00Z',
  //   updatedAt: '2026-09-17T12:00:00Z',
  // },

  // Pictures folder
  {
    id: 'pic-aurora',
    name: 'Nordic Aurora.jpg',
    path: '/Users/abhishek/Pictures',
    size: 5600000,
    type: 'image',
    extension: 'jpg',
    previewUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1200&auto=format&fit=crop',
    createdAt: '2026-09-12T14:00:00Z',
    updatedAt: '2026-09-12T14:00:00Z',
  },
  {
    id: 'pic-tokyo',
    name: 'Tokyo Twilight.jpg',
    path: '/Users/abhishek/Pictures',
    size: 7800000,
    type: 'image',
    extension: 'jpg',
    previewUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop',
    createdAt: '2026-09-10T20:00:00Z',
    updatedAt: '2026-09-10T20:00:00Z',
  },

  // Downloads
  {
    id: 'dl-node',
    name: 'abhishek-os-desktop-setup.exe',
    path: '/Users/abhishek/Downloads',
    size: 94500000,
    type: 'app',
    extension: 'exe',
    createdAt: '2026-09-19T04:00:00Z',
    updatedAt: '2026-09-19T04:00:00Z',
  }
];

export const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'track-1',
    title: 'Horizon Lights',
    artist: 'Abhishek Sound Labs',
    album: 'Atmospheres Vol. 1',
    duration: 184,
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=400&auto=format&fit=crop',
    synthesizerPreset: 'ambient',
  },
  {
    id: 'track-2',
    title: 'Neon Drift',
    artist: 'CyberKuntare',
    album: 'Midnight Tokyo',
    duration: 215,
    coverUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=400&auto=format&fit=crop',
    synthesizerPreset: 'synthwave',
  },
  {
    id: 'track-3',
    title: 'Deep Focus Flow',
    artist: 'Cortex Echoes',
    album: 'Coding Session IV',
    duration: 240,
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
    synthesizerPreset: 'chillhop',
  },
  {
    id: 'track-4',
    title: 'Solar Wind Serenade',
    artist: 'Starlight Symphony',
    album: 'Constellations',
    duration: 198,
    coverUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=400&auto=format&fit=crop',
    synthesizerPreset: 'classical',
  },
];

export interface MessageConversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  messages: {
    id: string;
    sender: 'them' | 'me';
    text: string;
    time: string;
    reactions?: string[];
  }[];
}

export const INITIAL_CONVERSATIONS: MessageConversation[] = [
  {
    id: 'conv-velosa',
    name: 'Velosa Studio',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    lastMessage: 'Super happy to lock this rough cut for our color session!',
    time: '9:41 AM',
    unreadCount: 0,
    messages: [
      {
        id: 'm1',
        sender: 'them',
        text: 'The driving scenes are working really well.',
        time: '9:38 AM',
      },
      {
        id: 'm2',
        sender: 'them',
        text: 'I think the new sequence made a huge improvement with the pacing and flow.',
        time: '9:39 AM',
      },
      {
        id: 'm3',
        sender: 'me',
        text: 'Simon, I’d like to finesse the night scenes before color grading.',
        time: '9:40 AM',
      },
      {
        id: 'm4',
        sender: 'them',
        text: 'Agreed! The ending is starting to look iconic.',
        time: '9:40 AM',
      },
      {
        id: 'm5',
        sender: 'me',
        text: 'Super happy to lock this rough cut for our color session!',
        time: '9:41 AM',
        reactions: ['❤️', '🔥'],
      },
    ],
  },
  {
    id: 'conv-designers',
    name: 'Design Collective',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    lastMessage: 'Check out the new glassmorphic control center tabs.',
    time: 'Yesterday',
    unreadCount: 2,
    messages: [
      {
        id: 'm10',
        sender: 'them',
        text: 'Did everyone review the Abhishek OS Figma tokens?',
        time: 'Yesterday 4:15 PM',
      },
      {
        id: 'm11',
        sender: 'them',
        text: 'Check out the new glassmorphic control center tabs.',
        time: 'Yesterday 4:18 PM',
      },
    ],
  },
  {
    id: 'conv-priya',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    lastMessage: 'Sounds fantastic! Catch up at 3pm?',
    time: 'Tuesday',
    unreadCount: 0,
    messages: [
      {
        id: 'm20',
        sender: 'me',
        text: 'Hey Priya, is the client demo ready for tomorrow?',
        time: 'Tuesday 2:00 PM',
      },
      {
        id: 'm21',
        sender: 'them',
        text: 'Sounds fantastic! Catch up at 3pm?',
        time: 'Tuesday 2:05 PM',
      },
    ],
  },
];

export interface TVShowItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  backdropUrl: string;
  category: 'trending' | 'continue' | 'original' | 'tech';
  rating: string;
  duration: string;
}

export const TV_ITEMS: TVShowItem[] = [
  {
    id: 'tv-1',
    title: 'Silicon Horizon',
    subtitle: 'The Architects of Next-Gen Computing',
    badge: 'Abhishek OS Original',
    backdropUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    category: 'trending',
    rating: '9.4',
    duration: '45m',
  },
  {
    id: 'tv-2',
    title: 'Deep Space Odyssey',
    subtitle: 'Journey Beyond the Oort Cloud',
    badge: '4K HDR',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    category: 'continue',
    rating: '9.1',
    duration: '1h 12m',
  },
  {
    id: 'tv-3',
    title: 'Cyberpunk Metropolis',
    subtitle: 'Neon Streets & Synthetic Minds',
    badge: 'Trending',
    backdropUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
    category: 'trending',
    rating: '8.8',
    duration: '52m',
  },
  {
    id: 'tv-4',
    title: 'Alpine Expeditions',
    subtitle: 'Summiting the Untamed Karakoram',
    badge: 'Documentary',
    backdropUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    category: 'original',
    rating: '9.6',
    duration: '1h 28m',
  },
];
