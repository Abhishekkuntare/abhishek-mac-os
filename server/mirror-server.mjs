import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOM_TTL_MS = 5 * 60 * 1000;
const MAX_ROOMS = 2000;
const MAX_SIGNAL_PAYLOAD = 64 * 1024;

const send = (socket, message) => {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
};

const closeSocket = (socket, code, message) => {
  if (socket?.readyState === WebSocket.OPEN) socket.close(code, message);
};

export const createMirrorServer = ({ port = Number(process.env.PORT) || 4173, publicOrigin = process.env.PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL } = {}) => {
  const app = express();
  const server = createServer(app);
  const webSocketServer = new WebSocketServer({ noServer: true, maxPayload: MAX_SIGNAL_PAYLOAD });
  const rooms = new Map();
  const roomRateLimits = new Map();
  const configuredOrigin = publicOrigin ? new URL(publicOrigin).origin : '';

  if (process.env.NODE_ENV === 'production' && configuredOrigin && !configuredOrigin.startsWith('https://')) {
    throw new Error('The mobile mirror service must use an HTTPS public origin in production.');
  }

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '8kb' }));

  app.use((request, response, next) => {
    const requestOrigin = request.get('origin');
    const permittedOrigins = new Set([
      configuredOrigin,
      'abhishek-local://desktop',
      'null',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
    if (requestOrigin && permittedOrigins.has(requestOrigin)) {
      response.setHeader('Access-Control-Allow-Origin', requestOrigin);
      response.setHeader('Vary', 'Origin');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (request.method === 'OPTIONS') {
      if (!requestOrigin || !permittedOrigins.has(requestOrigin)) {
        response.sendStatus(403);
        return;
      }
      response.sendStatus(204);
      return;
    }
    next();
  });

  app.get('/healthz', (_request, response) => response.json({ status: 'ok' }));
  app.get('/api/config', (_request, response) => response.json({
    iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
  }));

  app.post('/api/rooms', (request, response) => {
    const now = Date.now();
    const address = request.ip || request.socket.remoteAddress || 'unknown';
    const recentRequests = (roomRateLimits.get(address) || []).filter(time => now - time < 60_000);
    if (recentRequests.length >= 10) {
      roomRateLimits.set(address, recentRequests);
      response.status(429).json({ error: 'Too many pairing requests. Wait a minute and try again.' });
      return;
    }
    roomRateLimits.set(address, [...recentRequests, now]);

    for (const [token, room] of rooms) {
      if (room.expiresAt <= now) {
        clearTimeout(room.expiryTimer);
        room.desktop?.close(4001, 'Pairing expired');
        room.mobile?.close(4001, 'Pairing expired');
        rooms.delete(token);
      }
    }
    for (const [clientAddress, requests] of roomRateLimits) {
      if (!requests.some(time => now - time < 60_000)) roomRateLimits.delete(clientAddress);
    }
    if (rooms.size >= MAX_ROOMS) {
      response.status(503).json({ error: 'Pairing service is busy. Try again shortly.' });
      return;
    }

    const token = randomBytes(32).toString('base64url');
    const origin = configuredOrigin || `${request.get('x-forwarded-proto') || request.protocol}://${request.get('x-forwarded-host') || request.get('host')}`;
    let mobileUrl;
    try {
      const url = new URL(origin);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported pairing origin.');
      url.pathname = '/mobile-share';
      url.search = '';
      url.searchParams.set('room', token);
      mobileUrl = url.toString();
    } catch {
      response.status(500).json({ error: 'The pairing service has an invalid public origin.' });
      return;
    }

    const room = { expiresAt: now + ROOM_TTL_MS, desktop: null, mobile: null, expiryTimer: null };
    room.expiryTimer = setTimeout(() => {
      if (rooms.get(token) !== room) return;
      room.desktop?.close(4001, 'Pairing expired');
      room.mobile?.close(4001, 'Pairing expired');
      rooms.delete(token);
    }, ROOM_TTL_MS);
    room.expiryTimer.unref();
    rooms.set(token, room);
    response.status(201).json({ token, mobileUrl, expiresAt: now + ROOM_TTL_MS });
  });

  server.on('upgrade', (request, socket, head) => {
    let url;
    try {
      url = new URL(request.url || '/', 'http://localhost');
    } catch {
      socket.destroy();
      return;
    }
    if (url.pathname !== '/api/signal') {
      socket.destroy();
      return;
    }

    const token = url.searchParams.get('room') || '';
    const role = url.searchParams.get('role');
    const room = rooms.get(token);
    const requestOrigin = request.headers.origin;
    const permittedOrigins = new Set([
      configuredOrigin,
      'abhishek-local://desktop',
      'null',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
    if (!room || room.expiresAt <= Date.now() || !['desktop', 'mobile'].includes(role)) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }
    if (requestOrigin && !permittedOrigins.has(requestOrigin)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, webSocket => {
      if (room[role]) {
        closeSocket(webSocket, 4009, 'This device is already paired.');
        return;
      }

      room[role] = webSocket;
      const otherRole = role === 'desktop' ? 'mobile' : 'desktop';
      if (room[otherRole]) {
        send(room[otherRole], { type: 'peer-ready', role });
        send(webSocket, { type: 'peer-ready', role: otherRole });
      }

      webSocket.on('message', data => {
        let message;
        try {
          message = JSON.parse(data.toString());
        } catch {
          closeSocket(webSocket, 4002, 'Invalid signaling message.');
          return;
        }

        const validOffer = role === 'desktop' && message?.type === 'offer' && typeof message.sdp === 'string';
        const validAnswer = role === 'mobile' && message?.type === 'answer' && typeof message.sdp === 'string';
        const validCandidate = message?.type === 'candidate' &&
          (message.candidate === null || (
            typeof message.candidate === 'object' &&
            typeof message.candidate.candidate === 'string' &&
            message.candidate.candidate.length <= 4096
          ));
        if (!(validOffer || validAnswer || validCandidate)) {
          closeSocket(webSocket, 4002, 'Unsupported signaling message.');
          return;
        }
        if (validOffer || validAnswer) {
          const hasSdp = message.sdp.length > 0 && message.sdp.length <= 48_000 &&
            (message.type === 'offer' ? message.sdp.startsWith('v=0') : message.sdp.startsWith('v=0'));
          if (!hasSdp) {
            closeSocket(webSocket, 4002, 'Invalid session description.');
            return;
          }
        }
        send(room[otherRole], message);
      });

      webSocket.on('close', () => {
        if (room[role] === webSocket) room[role] = null;
        send(room[otherRole], { type: 'peer-left', role });
      });
      webSocket.on('error', error => {
        console.error('Mobile mirror signaling socket error:', error.message);
      });
    });
  });

  app.use(express.static(path.join(projectRoot, 'dist'), { index: false, maxAge: '1h' }));
  app.get('*', (_request, response) => response.sendFile(path.join(projectRoot, 'dist', 'index.html')));

  return {
    app,
    server,
    rooms,
    listen: () => new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '0.0.0.0', () => {
        server.removeListener('error', reject);
        resolve(server.address());
      });
    }),
    close: () => new Promise((resolve, reject) => {
      for (const room of rooms.values()) {
        clearTimeout(room.expiryTimer);
        room.desktop?.close(1001, 'Pairing service shutting down');
        room.mobile?.close(1001, 'Pairing service shutting down');
      }
      webSocketServer.close();
      server.close(error => error ? reject(error) : resolve());
    }),
  };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const service = createMirrorServer();
  service.listen().then(address => {
    console.log(`Mobile mirror service listening on ${address.address}:${address.port}`);
  }).catch(error => {
    console.error('Unable to start mobile mirror service:', error);
    process.exitCode = 1;
  });
  process.on('SIGINT', () => service.close().finally(() => process.exit(0)));
  process.on('SIGTERM', () => service.close().finally(() => process.exit(0)));
}
