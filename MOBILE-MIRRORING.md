# Phone screen sharing

The mirroring service provides an HTTPS-hosted phone companion and a small WebSocket signaling relay. WebRTC sends the screen directly between the phone and desktop; the relay does not receive or store the video. Pairing tokens are random, held in memory, and expire after five minutes. Restarting the service ends active sessions.

This first version is view-only. The phone browser and operating system decide whether screen capture is available; the companion reports unsupported browsers instead of simulating a connection. It cannot control phone apps, mirror protected content, or provide native iOS ReplayKit capture.

## Deploy the service to Render

1. Push this repository to GitHub and sign in to Render.
2. Choose **New → Blueprint**, connect the repository, and let Render read [`render.yaml`](./render.yaml).
3. Create the `abhishek-os-mobile-mirror` web service. Render's public service URL supplies HTTPS and is used to build pairing links.
4. Wait for the first deployment to finish, then open `https://<your-service>.onrender.com/healthz`. A healthy service returns `{"status":"ok"}`.
5. In ARLO OS, open **iPhone Mirroring → Pair & Settings**, paste the Render URL, and create a QR code. On the phone, scan it, tap **Start screen sharing**, and grant the browser's screen-capture permission.

The blueprint uses Render's free plan and disables automatic deployments. Free services can sleep when idle, so the first connection after inactivity may take a while. A paid always-on instance avoids that delay. This repository can prepare the service, but deploying it requires access to the user's Render account.

## Development and network notes

Run the desktop app with `npm run dev`. For a local signaling server, use `npm run start:mirror`; the desktop pairing field can use `http://localhost:4173`. A phone on another device still needs a publicly trusted HTTPS origin—LAN HTTP and self-signed certificates do not satisfy mobile browser screen-capture security requirements.

The service currently uses public STUN servers for direct WebRTC connections. Some corporate, carrier, or restrictive NAT networks also require a TURN relay; TURN credentials are not configured in this first version, so connections on those networks may fail. Supporting TURN reliably requires adding a provider that issues short-lived credentials. If a TURN relay is used, the screen video passes through that provider.

Run the service checks with `npm run test:mirror`. The screen-sharing companion is served at `/mobile-share` and the service health endpoint is `/healthz`.
