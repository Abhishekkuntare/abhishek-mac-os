import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createCloudProfilePayload,
  getProfileInstallationId,
  syncProfileToCloud,
} from '../src/services/profileSync.ts';

const profile = {
  fullName: 'Alex Doe',
  displayName: 'Alex',
  username: '',
  email: 'alex@example.com',
  avatarUrl: '',
  avatarType: 'initials',
  roles: ['Developer'],
  bio: '',
  pin: 'never-send-this',
};

const installationId = '6dd07f29-7a6b-4aed-b217-e08e78f4a9d0';

test('cloud profile payload contains opted-in identity fields but never the screen password', () => {
  const payload = createCloudProfilePayload(profile, installationId);

  assert.equal(payload.consent, true);
  assert.equal(payload.installationId, installationId);
  assert.equal(payload.fullName, 'Alex Doe');
  assert.equal(payload.displayName, 'Alex');
  assert.equal(payload.username, 'alex');
  assert.equal(payload.email, 'alex@example.com');
  assert.deepEqual(payload.roles, ['Developer']);
  assert.equal(Object.hasOwn(payload, 'pin'), false);
});

test('cloud profile payload includes an uploaded photo or allowlisted preset selection', () => {
  const uploadedPhoto = {
    ...profile,
    avatarType: 'upload',
    avatarUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
  };
  assert.equal(createCloudProfilePayload(uploadedPhoto, installationId).avatarData, uploadedPhoto.avatarUrl);

  const presetPhoto = { ...profile, avatarType: 'preset', avatarUrl: '/assets/sunny-girl.jpg' };
  assert.equal(
    createCloudProfilePayload(presetPhoto, installationId, 'sunny-girl.jpg').avatarPreset,
    'sunny-girl.jpg',
  );
});

test('profile sync posts to the configured service and reports server errors', async () => {
  let requestUrl;
  let requestOptions;
  await syncProfileToCloud(profile, undefined, {
    origin: 'https://analytics.example.com/',
    installationId,
    fetchImpl: async (url, options) => {
      requestUrl = String(url);
      requestOptions = options;
      return Response.json({ ok: true, locationAvailable: false });
    },
  });

  assert.equal(requestUrl, 'https://analytics.example.com/api/analytics/register');
  assert.equal(requestOptions.method, 'POST');
  assert.equal(JSON.parse(requestOptions.body).installationId, installationId);
  assert.deepEqual(JSON.parse(requestOptions.body).roles, ['Developer']);
  assert.equal(Object.hasOwn(JSON.parse(requestOptions.body), 'pin'), false);

  await assert.rejects(
    syncProfileToCloud(profile, undefined, {
      origin: 'https://analytics.example.com',
      installationId,
      fetchImpl: async () => Response.json({ error: 'Cloud analytics storage is unavailable.' }, { status: 503 }),
    }),
    /Cloud analytics storage is unavailable/,
  );
});

test('different profiles on one browser get separate IDs while repeat syncs reuse each profile ID', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  let nextId = 1;
  const createId = () => `6dd07f29-7a6b-4aed-b217-e08e78f4a9d${nextId++}`;

  const alexId = getProfileInstallationId('Alex@example.com', storage, createId);
  const alexRepeatId = getProfileInstallationId(' alex@EXAMPLE.com ', storage, createId);
  const samId = getProfileInstallationId('sam@example.com', storage, createId);

  assert.equal(alexId, alexRepeatId);
  assert.notEqual(alexId, samId);
});

test('syncing different email profiles creates separate IDs and repeat syncs reuse the matching ID', async () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const payloads = [];
  let nextId = 1;
  const createId = () => `6dd07f29-7a6b-4aed-b217-e08e78f4a9d${nextId++}`;
  const fetchImpl = async (_url, options) => {
    payloads.push(JSON.parse(options.body));
    return Response.json({ ok: true });
  };

  await syncProfileToCloud(profile, undefined, {
    origin: 'https://analytics.example.com',
    fetchImpl,
    storage,
    createId,
  });
  await syncProfileToCloud({ ...profile, email: ' ALEX@EXAMPLE.COM ' }, undefined, {
    origin: 'https://analytics.example.com',
    fetchImpl,
    storage,
    createId,
  });
  await syncProfileToCloud({ ...profile, email: 'sam@example.com' }, undefined, {
    origin: 'https://analytics.example.com',
    fetchImpl,
    storage,
    createId,
  });

  assert.equal(payloads[0].installationId, payloads[1].installationId);
  assert.notEqual(payloads[0].installationId, payloads[2].installationId);
});
