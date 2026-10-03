export const MOBILE_MIRROR_ORIGIN_KEY = 'abhishek_os_mobile_mirror_origin_v1';
export const MOBILE_MIRROR_DEFAULT_ORIGIN = import.meta.env.VITE_MOBILE_MIRROR_ORIGIN?.trim() || '';

export type MobileMirrorRole = 'desktop' | 'mobile';
export type MobileMirrorSignal =
  | { type: 'peer-ready'; role: MobileMirrorRole }
  | { type: 'peer-left'; role: MobileMirrorRole }
  | { type: 'offer' | 'answer'; sdp: string }
  | { type: 'candidate'; candidate: RTCIceCandidateInit | null };

export const normalizeMirrorOrigin = (origin: string) => {
  const parsed = new URL(origin.trim());
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Use an HTTPS address for the phone pairing service.');
  }
  if (parsed.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    throw new Error('The phone pairing service must use HTTPS.');
  }
  return parsed.origin;
};

export const getSavedMirrorOrigin = () => {
  try {
    const saved = localStorage.getItem(MOBILE_MIRROR_ORIGIN_KEY);
    if (saved) return saved;
  } catch {
    return MOBILE_MIRROR_DEFAULT_ORIGIN;
  }
  if (MOBILE_MIRROR_DEFAULT_ORIGIN) return MOBILE_MIRROR_DEFAULT_ORIGIN;
  try {
    return window.location.protocol === 'https:' ? window.location.origin : '';
  } catch {
    return '';
  }
};

export const makeSignalUrl = (origin: string, token: string, role: MobileMirrorRole) => {
  const url = new URL('/api/signal', normalizeMirrorOrigin(origin));
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('room', token);
  url.searchParams.set('role', role);
  return url.toString();
};

export const getIceServers = async (origin: string): Promise<RTCIceServer[]> => {
  const response = await fetch(`${normalizeMirrorOrigin(origin)}/api/config`);
  if (!response.ok) throw new Error(`Could not load mirror service settings (${response.status}).`);
  const config: unknown = await response.json();
  if (
    !config ||
    typeof config !== 'object' ||
    !('iceServers' in config) ||
    !Array.isArray(config.iceServers) ||
    !config.iceServers.every(server => {
      if (!server || typeof server !== 'object' || !('urls' in server)) return false;
      const urls = server.urls;
      return typeof urls === 'string' || (
        Array.isArray(urls) && urls.every(url => typeof url === 'string')
      );
    })
  ) {
    throw new Error('The mirror service returned invalid connection settings.');
  }
  return config.iceServers.map(server => {
    const item = server as Record<string, unknown>;
    if (typeof item.urls !== 'string' && !Array.isArray(item.urls)) {
      throw new Error('The mirror service returned invalid ICE server URLs.');
    }
    if (Array.isArray(item.urls) && !item.urls.every(url => typeof url === 'string')) {
      throw new Error('The mirror service returned invalid ICE server URLs.');
    }
    if (
      (item.username !== undefined && typeof item.username !== 'string') ||
      (item.credential !== undefined && typeof item.credential !== 'string')
    ) {
      throw new Error('The mirror service returned invalid ICE credentials.');
    }
    const urls = item.urls as string | string[];
    return {
      urls,
      ...(typeof item.username === 'string' ? { username: item.username } : {}),
      ...(typeof item.credential === 'string' ? { credential: item.credential } : {}),
    };
  });
};
