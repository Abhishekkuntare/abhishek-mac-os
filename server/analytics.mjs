import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ADMIN_SESSION_SECONDS = 8 * 60 * 60;
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_LIMIT = 5;
const GITHUB_REPOSITORY = 'Abhishekkuntare/arlo-os';
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE_AVATAR_PRESETS = new Set([
  'sunny-girl.jpg',
  'curly-glasses.jpg',
  'frog-hood-girl.jpg',
  'bear-hat-boy.jpg',
  'frog-cap-boy.jpg',
  'winking-boy.jpg',
  'adventurer-girl.jpg',
  'storybook-boy.jpg',
]);
const PROFILE_ROLES = new Set([
  'Developer',
  'Designer',
  'Engineer',
  'Artist',
  'Creator',
  'Student',
  'Entrepreneur',
  'Photographer',
  'Video Editor',
  'Musician',
  'Writer',
  'Researcher',
  'Gamer',
  'Freelancer',
  'Business Owner',
]);

const jsonError = (response, status, message) => response.status(status).json({ error: message });

const safeEqual = (left, right) => timingSafeEqual(
  createHash('sha256').update(left).digest(),
  createHash('sha256').update(right).digest(),
);

const asBase64Url = value => Buffer.from(value).toString('base64url');

const parseCookie = (header, name) => {
  const prefix = `${name}=`;
  const value = header.split(';').map(item => item.trim()).find(item => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : '';
};

const validateRegistration = body => {
  if (!body || body.consent !== true) return 'Cloud analytics consent is required.';
  if (typeof body.installationId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.installationId)) {
    return 'Invalid installation identifier.';
  }

  const fields = [
    ['fullName', 100],
    ['displayName', 100],
    ['username', 32],
    ['email', 254],
  ];
  for (const [name, maxLength] of fields) {
    if (typeof body[name] !== 'string' || body[name].trim().length === 0 || body[name].trim().length > maxLength) {
      return `Invalid ${name}.`;
    }
  }
  if (!/^[a-zA-Z0-9._-]{1,32}$/.test(body.username.trim())) return 'Invalid username.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return 'Invalid email address.';
  if (body.roles !== undefined &&
      (!Array.isArray(body.roles) || body.roles.length > PROFILE_ROLES.size ||
       body.roles.some(role => typeof role !== 'string' || !PROFILE_ROLES.has(role)) ||
       new Set(body.roles).size !== body.roles.length)) {
    return 'Invalid profile role selection.';
  }

  if (body.avatarData !== undefined && body.avatarData !== null) {
    if (typeof body.avatarData !== 'string' || body.avatarData.length > 400_000 ||
        !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(body.avatarData)) {
      return 'Invalid profile photo.';
    }
  }
  if (body.avatarPreset !== undefined && body.avatarPreset !== null &&
      (typeof body.avatarPreset !== 'string' || !PROFILE_AVATAR_PRESETS.has(body.avatarPreset))) {
    return 'Invalid profile illustration.';
  }
  if (body.avatarData && body.avatarPreset) return 'Choose one profile photo source.';
  return null;
};

export const attachAnalyticsRoutes = (app, { env = process.env, fetchImpl = fetch } = {}) => {
  const registrationRequests = new Map();
  const loginRequests = new Map();
  let githubStatsCache = null;
  let githubStatsCacheAt = 0;

  app.use('/api/admin', (_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    next();
  });

  const getSupabaseConfig = () => {
    const url = env.SUPABASE_URL?.trim().replace(/\/+$/, '');
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !serviceKey || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) return null;
    return { url, serviceKey };
  };

  const supabaseRequest = async (path, options = {}) => {
    const config = getSupabaseConfig();
    if (!config) throw new Error('Cloud analytics has not been configured on the server.');
    const response = await fetchImpl(`${config.url}${path}`, {
      ...options,
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        ...options.headers,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error(`[Analytics] Cloud database request failed (${response.status}).`);
      throw new Error('Cloud analytics storage is unavailable. Please try again later.');
    }
    return response;
  };

  const createSessionToken = email => {
    const secret = env.ADMIN_SESSION_SECRET;
    if (!secret || secret.length < 32) throw new Error('Admin access is not configured on the server.');
    const payload = asBase64Url(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS }));
    const signature = createHmac('sha256', secret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
  };

  const isAdminRequest = request => {
    const secret = env.ADMIN_SESSION_SECRET;
    if (!secret || secret.length < 32) return false;
    const token = parseCookie(request.headers.cookie || '', 'arlo_admin');
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return false;

    const expected = createHmac('sha256', secret).update(payload).digest();
    let actual;
    try {
      actual = Buffer.from(signature, 'base64url');
    } catch {
      return false;
    }
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

    try {
      const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      return session.email === env.ADMIN_EMAIL?.trim().toLowerCase() &&
        typeof session.exp === 'number' && session.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  };

  const requireAdmin = (request, response, next) => {
    if (!isAdminRequest(request)) return jsonError(response, 401, 'Sign in to view analytics.');
    return next();
  };

  const checkRateLimit = (store, request, max, windowMs) => {
    const address = request.ip || request.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const timestamps = (store.get(address) || []).filter(timestamp => now - timestamp < windowMs);
    if (timestamps.length >= max) {
      store.set(address, timestamps);
      return false;
    }
    timestamps.push(now);
    store.set(address, timestamps);
    if (store.size > 5000) {
      for (const [key, values] of store) {
        if (!values.some(timestamp => now - timestamp < windowMs)) store.delete(key);
      }
    }
    return true;
  };

  const geoLocate = async request => {
    const address = request.ip || request.socket.remoteAddress || '';
    if (!address || address === '::1' || address === '127.0.0.1' || address.startsWith('::ffff:127.')) {
      return { country: null, countryCode: null, region: null };
    }
    const response = await fetchImpl(
      `https://ipwho.is/${encodeURIComponent(address)}?fields=success,country,country_code,region`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!response.ok) throw new Error(`Location lookup returned ${response.status}.`);
    const data = await response.json();
    if (!data.success || typeof data.country !== 'string') {
      throw new Error('Location lookup could not determine a country.');
    }
    return {
      country: data.country.slice(0, 100),
      countryCode: typeof data.country_code === 'string' ? data.country_code.slice(0, 2) : null,
      region: typeof data.region === 'string' ? data.region.slice(0, 100) : null,
    };
  };

  const uploadAvatar = async (installationId, dataUrl, preset) => {
    let image;
    if (dataUrl) {
      const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
      if (!match) throw new Error('Invalid profile photo.');
      image = Buffer.from(match[1], 'base64');
      if (image.length > 256_000) throw new Error('User profile photos must be a JPEG under 256 KB.');
    } else if (preset) {
      if (!PROFILE_AVATAR_PRESETS.has(preset)) throw new Error('Invalid profile illustration.');
      image = await readFile(path.join(PROJECT_ROOT, 'src', 'assets', 'profile-characters', preset));
      if (image.length > 512_000) throw new Error('The selected profile illustration exceeds the upload limit.');
    } else {
      return null;
    }

    if (image.length < 4 || image[0] !== 0xff || image[1] !== 0xd8 || image[2] !== 0xff) {
      throw new Error('Profile photos must be valid JPEG images.');
    }
    await supabaseRequest(`/storage/v1/object/arlo-user-avatars/${installationId}.jpg`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
      body: image,
    });
    return `${installationId}.jpg`;
  };

  app.post('/api/analytics/register', async (request, response) => {
    if (!checkRateLimit(registrationRequests, request, 5, 60_000)) {
      return jsonError(response, 429, 'Too many profile sync attempts. Wait a minute and try again.');
    }
    const validationError = validateRegistration(request.body);
    if (validationError) return jsonError(response, 400, validationError);

    let location = { country: null, countryCode: null, region: null };
    try {
      location = await geoLocate(request);
    } catch (error) {
      console.warn('[Analytics] Approximate location unavailable; profile will be saved without it:', error.message);
    }

    try {
      const avatarPath = await uploadAvatar(request.body.installationId, request.body.avatarData, request.body.avatarPreset);
      const row = {
        id: request.body.installationId,
        full_name: request.body.fullName.trim(),
        display_name: request.body.displayName.trim(),
        username: request.body.username.trim(),
        email: request.body.email.trim().toLowerCase(),
        roles: request.body.roles || [],
        avatar_path: avatarPath,
        country: location.country,
        country_code: location.countryCode,
        region: location.region,
        consent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await supabaseRequest('/rest/v1/analytics_users?on_conflict=id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(row),
      });
      return response.status(201).json({ ok: true, locationAvailable: Boolean(location.country) });
    } catch (error) {
      console.error('[Analytics] Could not save opted-in profile:', error.message);
      return jsonError(response, 503, error.message || 'Could not save profile to cloud analytics.');
    }
  });

  app.post('/api/admin/login', (request, response) => {
    if (!checkRateLimit(loginRequests, request, ADMIN_LOGIN_LIMIT, ADMIN_LOGIN_WINDOW_MS)) {
      return jsonError(response, 429, 'Too many sign-in attempts. Try again in 15 minutes.');
    }
    const configuredEmail = env.ADMIN_EMAIL?.trim().toLowerCase();
    const configuredPassword = env.ADMIN_PASSWORD;
    if (!configuredEmail || !configuredPassword || configuredPassword.length < 16 ||
        !env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length < 32) {
      return jsonError(response, 503, 'Admin access has not been configured on the server.');
    }
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    if (!safeEqual(email, configuredEmail) || !safeEqual(password, configuredPassword)) {
      return jsonError(response, 401, 'Email or password is incorrect.');
    }

    loginRequests.delete(request.ip || request.socket.remoteAddress || 'unknown');
    let token;
    try {
      token = createSessionToken(configuredEmail);
    } catch (error) {
      return jsonError(response, 503, error.message);
    }
    const secure = env.NODE_ENV === 'production' ? '; Secure' : '';
    response.setHeader('Set-Cookie', `arlo_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${ADMIN_SESSION_SECONDS}${secure}`);
    return response.json({ ok: true, email: configuredEmail });
  });

  app.get('/api/admin/session', (request, response) => {
    const authenticated = isAdminRequest(request);
    response.json({
      authenticated,
      email: authenticated ? env.ADMIN_EMAIL?.trim().toLowerCase() || null : null,
    });
  });

  app.post('/api/admin/logout', requireAdmin, (_request, response) => {
    const secure = env.NODE_ENV === 'production' ? '; Secure' : '';
    response.setHeader('Set-Cookie', `arlo_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`);
    response.json({ ok: true });
  });

  app.get('/api/admin/dashboard', requireAdmin, async (_request, response) => {
    try {
      const [usersResult, summaryResult, githubResult] = await Promise.allSettled([
        supabaseRequest('/rest/v1/analytics_users?select=id,full_name,display_name,username,email,roles,country,country_code,region,avatar_path,created_at&order=created_at.desc&limit=100'),
        supabaseRequest('/rest/v1/rpc/analytics_dashboard_summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
        getGithubStats(),
      ]);
      if (usersResult.status === 'rejected') throw usersResult.reason;
      if (summaryResult.status === 'rejected') throw summaryResult.reason;
      const usersResponse = usersResult.value;
      const summaryResponse = summaryResult.value;
      const users = await usersResponse.json();
      const summary = await summaryResponse.json();
      const github = githubResult.status === 'fulfilled' ? githubResult.value : null;
      const githubError = githubResult.status === 'rejected'
        ? githubResult.reason instanceof Error ? githubResult.reason.message : 'GitHub project metrics are unavailable.'
        : null;
      return response.json({ users, summary, github, githubError });
    } catch (error) {
      console.error('[Analytics] Could not load dashboard:', error.message);
      return jsonError(response, 503, error.message || 'Could not load analytics.');
    }
  });

  app.get('/api/admin/avatar/:id', requireAdmin, async (request, response) => {
    if (!/^[0-9a-f-]{36}$/i.test(request.params.id)) return jsonError(response, 400, 'Invalid profile identifier.');
    try {
      const profileResponse = await supabaseRequest(`/rest/v1/analytics_users?select=avatar_path&id=eq.${encodeURIComponent(request.params.id)}&limit=1`);
      const [profile] = await profileResponse.json();
      if (!profile?.avatar_path) return response.sendStatus(404);

      const signedResponse = await supabaseRequest(
        `/storage/v1/object/sign/arlo-user-avatars/${encodeURIComponent(profile.avatar_path)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresIn: 3600 }),
        },
      );
      const signed = await signedResponse.json();
      const signedPath = signed.signedURL || signed.signedUrl;
      if (typeof signedPath !== 'string') throw new Error('Cloud storage did not return a profile photo link.');
      const imageUrl = signedPath.startsWith('http') ? signedPath : `${getSupabaseConfig().url}/storage/v1${signedPath}`;
      const imageResponse = await fetchImpl(imageUrl, { signal: AbortSignal.timeout(10_000) });
      if (!imageResponse.ok) return response.sendStatus(404);
      response.setHeader('Cache-Control', 'private, max-age=300');
      response.setHeader('Content-Type', 'image/jpeg');
      return response.send(Buffer.from(await imageResponse.arrayBuffer()));
    } catch (error) {
      console.error('[Analytics] Could not load private profile photo:', error.message);
      return jsonError(response, 503, 'Could not load the profile photo.');
    }
  });

  async function getGithubStats() {
    if (githubStatsCache && Date.now() - githubStatsCacheAt < 10 * 60_000) return githubStatsCache;
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ARLO-OS-Analytics' };
    const [repositoryResponse, releasesResponse] = await Promise.all([
      fetchImpl(`https://api.github.com/repos/${GITHUB_REPOSITORY}`, { headers, signal: AbortSignal.timeout(8000) }),
      fetchImpl(`https://api.github.com/repos/${GITHUB_REPOSITORY}/releases?per_page=100`, { headers, signal: AbortSignal.timeout(8000) }),
    ]);
    if (!repositoryResponse.ok || !releasesResponse.ok) {
      throw new Error('GitHub project metrics are temporarily unavailable.');
    }
    const [repository, releases] = await Promise.all([repositoryResponse.json(), releasesResponse.json()]);
    if (!Number.isInteger(repository.stargazers_count) || !Array.isArray(releases)) {
      throw new Error('GitHub returned an unexpected project metrics response.');
    }
    githubStatsCache = {
      stars: repository.stargazers_count,
      releaseDownloads: releases.reduce((total, release) =>
        total + (Array.isArray(release.assets) ? release.assets.reduce((sum, asset) => sum + (Number(asset.download_count) || 0), 0) : 0), 0),
      releasesIncluded: releases.length,
      repositoryUrl: `https://github.com/${GITHUB_REPOSITORY}`,
      fetchedAt: new Date().toISOString(),
    };
    githubStatsCacheAt = Date.now();
    return githubStatsCache;
  }
};
