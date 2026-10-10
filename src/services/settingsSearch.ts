export interface SettingsDestination {
  id: string;
  title: string;
  subtitle: string;
  tab: string;
  anchor?: string;
  keywords: string;
}

const SETTINGS_DESTINATIONS: SettingsDestination[] = [
  {
    id: 'jelly-notch',
    title: 'Jelly Notch',
    subtitle: 'Open Notch controls in Settings → Appearance',
    tab: 'appearance',
    anchor: 'arlo-jelly-notch-settings',
    keywords: 'notch jelly notch dynamic island top bar dashboard notch settings where is notch',
  },
  {
    id: 'appearance',
    title: 'Appearance settings',
    subtitle: 'Theme, accent color, and interface style',
    tab: 'appearance',
    keywords: 'appearance theme dark light accent interface',
  },
  {
    id: 'wallpaper',
    title: 'Wallpaper settings',
    subtitle: 'Change desktop and lock-screen backgrounds',
    tab: 'wallpaper',
    keywords: 'wallpaper background desktop lock screen',
  },
  {
    id: 'dock',
    title: 'Dock settings',
    subtitle: 'Position, size, and behavior',
    tab: 'dock',
    keywords: 'dock taskbar app bar position size',
  },
  {
    id: 'sound',
    title: 'Sound settings',
    subtitle: 'System sound and volume controls',
    tab: 'sound',
    keywords: 'sound audio volume',
  },
  {
    id: 'media',
    title: 'Media settings',
    subtitle: 'Configure notch music controls and the Jamendo catalog',
    tab: 'media',
    keywords: 'media music notch album art hover controls visualizer spectrum jamendo catalog',
  },
  {
    id: 'focus',
    title: 'Focus settings',
    subtitle: 'Focus Mode and notification preferences',
    tab: 'focus',
    keywords: 'focus do not disturb dnd notifications',
  },
  {
    id: 'wifi',
    title: 'Wi-Fi settings',
    subtitle: 'Network connection preferences',
    tab: 'wifi',
    keywords: 'wifi wi-fi network internet',
  },
  {
    id: 'bluetooth',
    title: 'Bluetooth settings',
    subtitle: 'Bluetooth connection preferences',
    tab: 'bluetooth',
    keywords: 'bluetooth wireless devices',
  },
  {
    id: 'battery',
    title: 'Battery settings',
    subtitle: 'Battery and power options',
    tab: 'battery',
    keywords: 'battery power low power charging',
  },
  {
    id: 'health',
    title: 'Health settings',
    subtitle: 'Break reminders and wellbeing options',
    tab: 'health',
    keywords: 'health wellbeing wellness breaks',
  },
  {
    id: 'day-progress',
    title: 'Day Progress settings',
    subtitle: 'Configure the daily progress widget',
    tab: 'dayProgress',
    keywords: 'day progress daily schedule calendar',
  },
  {
    id: 'ghost',
    title: 'Ghost AI settings',
    subtitle: 'Assistant and detective preferences',
    tab: 'ghost',
    keywords: 'ghost ai assistant detective',
  },
];

const getSearchTerms = (query: string) =>
  query.toLowerCase().replace(/[?!.,]/g, '').trim().split(/\s+/).filter(term =>
    term && !['where', 'is', 'the', 'open', 'show', 'go', 'to', 'settings', 'setting', 'for', 'me'].includes(term),
  );

export const searchSettingsDestinations = (query: string): SettingsDestination[] => {
  const terms = getSearchTerms(query);
  if (!terms.length) return [];
  return SETTINGS_DESTINATIONS.filter(destination => {
    const searchable = `${destination.title} ${destination.subtitle} ${destination.keywords}`.toLowerCase();
    return terms.every(term => searchable.includes(term));
  });
};

export const openSettingsDestination = (
  destination: SettingsDestination,
  openApp: (appId: string) => void,
): void => {
  const detail = { tab: destination.tab, anchor: destination.anchor };
  try {
    sessionStorage.setItem('arlo-pending-settings-section', JSON.stringify(detail));
  } catch (error) {
    console.error('[Settings Search] Could not persist the Settings destination.', error);
  }
  openApp('settings');
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('arlo:open-settings-section', {
      detail,
    }));
  }, 220);
};
