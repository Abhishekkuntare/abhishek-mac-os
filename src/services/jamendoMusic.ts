import type { AudioTrack } from '../types/desktop';

interface JamendoApiResponse {
  headers?: {
    status?: string;
    error_message?: string;
  };
  results?: Array<{
    id: string;
    name: string;
    artist_name: string;
    album_name?: string;
    duration: number;
    image?: string;
    album_image?: string;
    audio: string;
    shorturl?: string;
    license_ccurl?: string;
  }>;
}

export const searchJamendoTracks = async (
  clientId: string,
  query: string,
  signal?: AbortSignal,
): Promise<AudioTrack[]> => {
  const normalizedClientId = clientId.trim();
  const normalizedQuery = query.trim();
  if (!normalizedClientId) throw new Error('Add your Jamendo client ID in Settings > Media to search the free catalog.');
  if (!normalizedQuery) throw new Error('Enter a song, artist, or genre to search.');

  const params = new URLSearchParams({
    client_id: normalizedClientId,
    format: 'json',
    limit: '20',
    order: 'popularity_total',
    audioformat: 'mp31',
    imagesize: '500',
    namesearch: normalizedQuery,
  });
  const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`, { signal });
  if (!response.ok) throw new Error(`Jamendo search failed (${response.status}). Try again in a moment.`);

  const data = await response.json() as JamendoApiResponse;
  if (data.headers?.status === 'failed') {
    throw new Error(data.headers.error_message || 'Jamendo could not complete the search.');
  }

  return (data.results ?? [])
    .filter(track => track.id && track.name && track.artist_name && track.audio)
    .map(track => ({
      id: `jamendo-${track.id}`,
      title: track.name,
      artist: track.artist_name,
      album: track.album_name || 'Jamendo',
      duration: Number.isFinite(track.duration) && track.duration > 0 ? track.duration : 180,
      coverUrl: track.album_image || track.image || '',
      audioUrl: track.audio,
      sourceUrl: track.shorturl || `https://www.jamendo.com/track/${track.id}`,
      licenseUrl: track.license_ccurl,
    }));
};
