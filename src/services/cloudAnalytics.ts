import type { UserProfile } from '../types/desktop';

const ANALYTICS_API_ORIGIN = (
  import.meta.env.VITE_ANALYTICS_API_ORIGIN ||
  import.meta.env.VITE_MOBILE_MIRROR_ORIGIN ||
  ''
).trim().replace(/\/+$/, '');
const INSTALLATION_ID_KEY = 'arlo_os_analytics_installation_id_v1';

const getInstallationId = () => {
  const saved = localStorage.getItem(INSTALLATION_ID_KEY);
  if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return saved;
  const installationId = crypto.randomUUID();
  localStorage.setItem(INSTALLATION_ID_KEY, installationId);
  return installationId;
};

const getAvatarData = async (avatarUrl: string) => {
  if (!avatarUrl) return undefined;
  const image = new Image();
  image.src = avatarUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not prepare the selected profile photo for cloud storage.'));
  });

  const scale = Math.min(1, 192 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the selected profile photo for cloud storage.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.65);
};

export const saveOptedInProfile = async (profile: UserProfile, avatarPreset?: string) => {
  if (!ANALYTICS_API_ORIGIN) {
    throw new Error('Cloud profile storage is not configured in this app build. You can continue without sharing analytics.');
  }
  if (profile.avatarType === 'preset' && !avatarPreset) {
    throw new Error('Could not identify the selected profile illustration for cloud storage.');
  }

  const installationId = getInstallationId();
  const avatarData = profile.avatarType === 'upload' ? await getAvatarData(profile.avatarUrl) : undefined;
  const response = await fetch(`${ANALYTICS_API_ORIGIN}/api/analytics/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consent: true,
      installationId,
      fullName: profile.fullName,
      displayName: profile.displayName,
      username: profile.username || profile.displayName.toLowerCase().replace(/[^a-z0-9._-]+/g, '').slice(0, 32) || 'user',
      email: profile.email,
      avatarData,
      avatarPreset,
    }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(typeof result?.error === 'string' ? result.error : `Cloud profile storage failed (${response.status}).`);
  }
  if (result?.ok !== true) throw new Error('The cloud service did not confirm your profile was saved.');
  return { locationAvailable: result.locationAvailable === true };
};
