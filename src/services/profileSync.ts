import type { UserProfile } from '../types/desktop';

const DEPLOYED_ANALYTICS_ORIGIN = 'https://arlo-os.onrender.com';
const PROFILE_IDS_KEY = 'arlo_os_cloud_analytics_profile_ids_v1';
const PROFILE_AVATAR_PRESETS = [
  'sunny-girl.jpg',
  'curly-glasses.jpg',
  'frog-hood-girl.jpg',
  'bear-hat-boy.jpg',
  'frog-cap-boy.jpg',
  'winking-boy.jpg',
  'adventurer-girl.jpg',
  'storybook-boy.jpg',
];

const getAnalyticsOrigin = () => (
  import.meta.env?.VITE_ANALYTICS_API_ORIGIN?.trim() || DEPLOYED_ANALYTICS_ORIGIN
).replace(/\/+$/, '');

const isInstallationId = (value: unknown): value is string => (
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
);

export const getProfileInstallationId = (
  email: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
  createId: () => string = () => crypto.randomUUID(),
) => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Enter an email address before syncing your profile.');

  const storedProfiles = storage.getItem(PROFILE_IDS_KEY);
  let profileIds: Record<string, string> = {};
  if (storedProfiles) {
    try {
      const parsed: unknown = JSON.parse(storedProfiles);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        profileIds = Object.fromEntries(
          Object.entries(parsed).filter((entry): entry is [string, string] => isInstallationId(entry[1])),
        );
      }
    } catch {
      profileIds = {};
    }
  }

  const existingId = profileIds[normalizedEmail];
  if (existingId) return existingId;

  const installationId = createId();
  profileIds[normalizedEmail] = installationId;
  storage.setItem(PROFILE_IDS_KEY, JSON.stringify(profileIds));
  return installationId;
};

export const createCloudProfilePayload = (
  profile: UserProfile,
  installationId: string,
  avatarPreset?: string,
) => {
  const displayName = profile.displayName.trim() || profile.fullName.trim();
  const username = profile.username.trim() ||
    displayName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 32) ||
    'user';
  const isUploadedJpeg = profile.avatarType === 'upload' &&
    profile.avatarUrl.startsWith('data:image/jpeg;base64,');
  const inferredPreset = PROFILE_AVATAR_PRESETS.find(preset =>
    profile.avatarUrl.toLowerCase().includes(preset.replace('.jpg', '')));
  const selectedPreset = avatarPreset || profile.avatarPreset || inferredPreset;
  if (profile.avatarType === 'preset' && !selectedPreset) {
    throw new Error('Could not identify this profile illustration. Choose an ARLO profile illustration and try again.');
  }

  return {
    consent: true,
    installationId,
    fullName: profile.fullName.trim(),
    displayName,
    username,
    email: profile.email.trim(),
    roles: Array.isArray(profile.roles) ? [...new Set(profile.roles)] : [],
    ...(isUploadedJpeg ? { avatarData: profile.avatarUrl } : {}),
    ...(profile.avatarType === 'preset' ? { avatarPreset: selectedPreset } : {}),
  };
};

const convertImageToJpeg = async (dataUrl: string) => {
  if (!dataUrl.startsWith('data:image/')) {
    throw new Error('The selected profile photo is unavailable. Choose the photo again and retry.');
  }

  const image = new Image();
  image.src = dataUrl;
  try {
    await image.decode();
  } catch {
    throw new Error('The selected profile photo could not be prepared for cloud storage.');
  }

  const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the selected profile photo.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.78, 0.68, 0.58, 0.48]) {
    const jpeg = canvas.toDataURL('image/jpeg', quality);
    if (jpeg.length <= 330_000) return jpeg;
  }
  throw new Error('The profile photo is too large to save. Choose a smaller image and retry.');
};

export const syncProfileToCloud = async (
  profile: UserProfile,
  avatarPreset?: string,
  options: {
    origin?: string;
    fetchImpl?: typeof fetch;
    installationId?: string;
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
    createId?: () => string;
  } = {},
) => {
  const installationId = options.installationId ||
    getProfileInstallationId(profile.email, options.storage, options.createId);
  const profileForUpload = profile.avatarType === 'upload'
    ? { ...profile, avatarUrl: await convertImageToJpeg(profile.avatarUrl) }
    : profile;
  const response = await (options.fetchImpl || fetch)(
    `${(options.origin || getAnalyticsOrigin()).replace(/\/+$/, '')}/api/analytics/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createCloudProfilePayload(profileForUpload, installationId, avatarPreset)),
      signal: AbortSignal.timeout(60_000),
    },
  );
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(typeof result?.error === 'string'
      ? result.error
      : `Cloud profile save failed (${response.status}).`);
  }
  if (result?.ok !== true) {
    throw new Error('The cloud service returned an unexpected profile-save response.');
  }
};
