import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createMirrorServer } from './mirror-server.mjs';

const activeServices = new Set();

const startService = async options => {
  const service = createMirrorServer({ port: 0, ...options });
  activeServices.add(service);
  const address = await service.listen();
  return { service, origin: `http://127.0.0.1:${address.port}` };
};

afterEach(async () => {
  await Promise.all([...activeServices].map(async service => {
    await service.close();
    activeServices.delete(service);
  }));
});

const analyticsEnv = {
  NODE_ENV: 'test',
  SUPABASE_URL: 'https://arlo-test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-secret',
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD: 'a-private-test-password',
  ADMIN_SESSION_SECRET: 'a-session-secret-that-is-longer-than-thirty-two-characters',
};

test('profile registration requires explicit consent and stores only opted-in profile fields', async () => {
  const databaseRequests = [];
  const { origin } = await startService({
    analyticsEnv,
    fetchImpl: async (url, options) => {
      databaseRequests.push({ url: String(url), options });
      return new Response(null, { status: 204 });
    },
  });

  const withoutConsent = await fetch(`${origin}/api/analytics/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consent: false }),
  });
  assert.equal(withoutConsent.status, 400);
  assert.equal(databaseRequests.length, 0);

  const installationId = '6dd07f29-7a6b-4aed-b217-e08e78f4a9d0';
  const response = await fetch(`${origin}/api/analytics/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consent: true,
      installationId,
      fullName: 'A User',
      displayName: 'A',
      username: 'a-user',
      email: 'a@example.com',
      roles: ['Developer', 'Student'],
      pin: 'do-not-send-this',
    }),
  });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true, locationAvailable: false });
  assert.equal(databaseRequests.length, 1);

  const savedProfile = JSON.parse(databaseRequests[0].options.body);
  assert.equal(savedProfile.id, installationId);
  assert.equal(savedProfile.email, 'a@example.com');
  assert.deepEqual(savedProfile.roles, ['Developer', 'Student']);
  assert.equal(Object.hasOwn(savedProfile, 'pin'), false);
  assert.equal(savedProfile.country, null);
  assert.equal(Object.hasOwn(savedProfile, 'ip'), false);
  assert.equal(databaseRequests[0].options.headers.apikey, analyticsEnv.SUPABASE_SERVICE_ROLE_KEY);
});

test('profile registration rejects role values that are not offered by onboarding', async () => {
  let databaseWriteCount = 0;
  const { origin } = await startService({
    analyticsEnv,
    fetchImpl: async () => {
      databaseWriteCount += 1;
      return new Response(null, { status: 204 });
    },
  });
  const response = await fetch(`${origin}/api/analytics/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consent: true,
      installationId: '6dd07f29-7a6b-4aed-b217-e08e78f4a9d0',
      fullName: 'A User',
      displayName: 'A',
      username: 'a-user',
      email: 'a@example.com',
      roles: ['Administrator'],
    }),
  });

  assert.equal(response.status, 400);
  assert.equal(databaseWriteCount, 0);
});

test('location enrichment stores country and region without persisting the request IP', async () => {
  let savedProfile;
  let locationRequest;
  const { origin } = await startService({
    analyticsEnv,
    fetchImpl: async (url, options) => {
      if (String(url).startsWith('https://ipwho.is/')) {
        locationRequest = String(url);
        return Response.json({ success: true, country: 'Canada', country_code: 'CA', region: 'Ontario' });
      }
      savedProfile = JSON.parse(options.body);
      return new Response(null, { status: 204 });
    },
  });

  const response = await fetch(`${origin}/api/analytics/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.23' },
    body: JSON.stringify({
      consent: true,
      installationId: '6dd07f29-7a6b-4aed-b217-e08e78f4a9d0',
      fullName: 'A User',
      displayName: 'A',
      username: 'a-user',
      email: 'a@example.com',
      roles: ['Developer'],
    }),
  });
  assert.equal(response.status, 201);
  assert.match(locationRequest, /198\.51\.100\.23/);
  assert.equal(savedProfile.country, 'Canada');
  assert.equal(savedProfile.country_code, 'CA');
  assert.equal(savedProfile.region, 'Ontario');
  assert.equal(Object.hasOwn(savedProfile, 'ip'), false);
  assert.equal(Object.hasOwn(savedProfile, '198.51.100.23'), false);
});

test('preset portraits are resolved from the server allowlist and uploaded privately', async () => {
  const uploadRequests = [];
  let savedProfile;
  const { origin } = await startService({
    analyticsEnv,
    fetchImpl: async (url, options) => {
      uploadRequests.push({ url: String(url), options });
      if (String(url).includes('/storage/v1/object/')) return new Response(null, { status: 200 });
      savedProfile = JSON.parse(options.body);
      return new Response(null, { status: 204 });
    },
  });

  const response = await fetch(`${origin}/api/analytics/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consent: true,
      installationId: '6dd07f29-7a6b-4aed-b217-e08e78f4a9d0',
      fullName: 'A User',
      displayName: 'A',
      username: 'a-user',
      email: 'a@example.com',
      roles: ['Developer'],
      avatarPreset: 'sunny-girl.jpg',
    }),
  });
  assert.equal(response.status, 201);
  assert.equal(uploadRequests[0].url, `${analyticsEnv.SUPABASE_URL}/storage/v1/object/arlo-user-avatars/6dd07f29-7a6b-4aed-b217-e08e78f4a9d0.jpg`);
  assert.equal(Buffer.isBuffer(uploadRequests[0].options.body), true);
  assert.equal(uploadRequests[0].options.body[0], 0xff);
  assert.equal(savedProfile.avatar_path, '6dd07f29-7a6b-4aed-b217-e08e78f4a9d0.jpg');
});

test('dashboard APIs reject anonymous requests and return metrics only after administrator login', async () => {
  const { origin } = await startService({
    analyticsEnv,
    fetchImpl: async url => {
      const parsed = new URL(String(url));
      if (parsed.hostname === 'arlo-test.supabase.co' && parsed.pathname.endsWith('/analytics_dashboard_summary')) {
        return Response.json({ total_users: 1, countries: [{ country: 'India', countryCode: 'IN', total: 1 }] });
      }
      if (parsed.hostname === 'arlo-test.supabase.co') {
        return Response.json([{ id: '6dd07f29-7a6b-4aed-b217-e08e78f4a9d0', display_name: 'A', email: 'a@example.com', roles: ['Developer'] }]);
      }
      if (parsed.hostname === 'api.github.com' && parsed.pathname.endsWith('/releases')) {
        return Response.json([{ assets: [{ download_count: 12 }] }]);
      }
      if (parsed.hostname === 'api.github.com') return Response.json({ stargazers_count: 7 });
      throw new Error(`Unexpected mock request: ${parsed.href}`);
    },
  });

  const anonymousResponse = await fetch(`${origin}/api/admin/dashboard`);
  assert.equal(anonymousResponse.status, 401);

  const deniedLogin = await fetch(`${origin}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: analyticsEnv.ADMIN_EMAIL, password: 'wrong' }),
  });
  assert.equal(deniedLogin.status, 401);

  const login = await fetch(`${origin}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: analyticsEnv.ADMIN_EMAIL, password: analyticsEnv.ADMIN_PASSWORD }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';', 1)[0];

  const session = await fetch(`${origin}/api/admin/session`, { headers: { Cookie: cookie } });
  assert.deepEqual(await session.json(), { authenticated: true, email: analyticsEnv.ADMIN_EMAIL });

  const dashboard = await fetch(`${origin}/api/admin/dashboard`, { headers: { Cookie: cookie } });
  assert.equal(dashboard.status, 200);
  const data = await dashboard.json();
  assert.equal(data.summary.total_users, 1);
  assert.equal(data.users[0].email, 'a@example.com');
  assert.deepEqual(data.users[0].roles, ['Developer']);
  assert.equal(data.github.stars, 7);
  assert.equal(data.github.releaseDownloads, 12);
});
