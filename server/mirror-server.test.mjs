import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { WebSocket } from 'ws';
import { createMirrorServer } from './mirror-server.mjs';

let service;
let origin;

before(async () => {
  service = createMirrorServer({ port: 0, publicOrigin: 'https://mirror.example.test' });
  const address = await service.listen();
  origin = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await service.close();
});

test('health endpoint reports a ready service', async () => {
  const response = await fetch(`${origin}/healthz`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('pairing links use an unguessable room token and expire after five minutes', async () => {
  const response = await fetch(`${origin}/api/rooms`, { method: 'POST' });
  assert.equal(response.status, 201);
  const session = await response.json();
  assert.equal(typeof session.token, 'string');
  assert.ok(session.token.length >= 40);
  assert.equal(new URL(session.mobileUrl).origin, 'https://mirror.example.test');
  assert.equal(new URL(session.mobileUrl).pathname, '/mobile-share');
  assert.equal(new URL(session.mobileUrl).searchParams.get('room'), session.token);
  assert.ok(session.expiresAt > Date.now());
});

test('signaling pairs one desktop and one phone and relays SDP offers', async () => {
  const response = await fetch(`${origin}/api/rooms`, { method: 'POST' });
  const { token } = await response.json();
  const signalUrl = role => {
    const url = new URL('/api/signal', origin);
    url.protocol = 'ws:';
    url.searchParams.set('room', token);
    url.searchParams.set('role', role);
    return url.toString();
  };
  const desktop = new WebSocket(signalUrl('desktop'));
  const mobile = new WebSocket(signalUrl('mobile'));
  const desktopMessages = [];
  const mobileMessages = [];
  desktop.on('message', data => desktopMessages.push(JSON.parse(data.toString())));
  mobile.on('message', data => mobileMessages.push(JSON.parse(data.toString())));
  await Promise.all([once(desktop, 'open'), once(mobile, 'open')]);

  await new Promise(resolve => {
    const check = () => {
      if (desktopMessages.some(message => message.type === 'peer-ready') &&
          mobileMessages.some(message => message.type === 'peer-ready')) resolve();
      else setTimeout(check, 5);
    };
    check();
  });

  desktop.send(JSON.stringify({ type: 'offer', sdp: 'v=0\r\ns=-\r\n' }));
  await new Promise(resolve => {
    const check = () => {
      if (mobileMessages.some(message => message.type === 'offer')) resolve();
      else setTimeout(check, 5);
    };
    check();
  });
  assert.ok(mobileMessages.some(message => message.type === 'offer' && message.sdp.startsWith('v=0')));

  desktop.close();
  mobile.close();
});

test('signaling rejects invalid session tokens', async () => {
  const socket = new WebSocket(`${origin.replace('http:', 'ws:')}/api/signal?room=invalid&role=desktop`);
  socket.on('error', () => {});
  const statusCode = new Promise(resolve => {
    socket.once('unexpected-response', (_request, response) => resolve(response.statusCode));
  });
  assert.equal(await statusCode, 404);
  socket.terminate();
});
