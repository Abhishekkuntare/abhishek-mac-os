import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, LoaderCircle, Monitor, QrCode, RotateCw, ScreenShare, Shield, Smartphone, Wifi, X } from 'lucide-react';
import {
  getIceServers,
  getSavedMirrorOrigin,
  makeSignalUrl,
  MOBILE_MIRROR_ORIGIN_KEY,
  normalizeMirrorOrigin,
  type MobileMirrorSignal,
} from '../../services/mobileMirror';

interface MobileMirrorPairingProps {
  onStream: (stream: MediaStream | null) => void;
}

interface PairingSession {
  token: string;
  mobileUrl: string;
}

type PairingStatus = 'idle' | 'creating' | 'waiting' | 'connecting' | 'connected' | 'error';

const parseSignal = (data: string): MobileMirrorSignal => {
  const message: unknown = JSON.parse(data);
  if (!message || typeof message !== 'object' || !('type' in message)) {
    throw new Error('The pairing service sent an invalid message.');
  }
  return message as MobileMirrorSignal;
};

export const MobileMirrorPairing: React.FC<MobileMirrorPairingProps> = ({ onStream }) => {
  const [origin, setOrigin] = useState(getSavedMirrorOrigin);
  const [pairing, setPairing] = useState<PairingSession | null>(null);
  const [qrData, setQrData] = useState('');
  const [status, setStatus] = useState<PairingStatus>('idle');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const sessionGenerationRef = useRef(0);

  const stopSession = () => {
    sessionGenerationRef.current += 1;
    peerRef.current?.close();
    peerRef.current = null;
    socketRef.current?.close(1000, 'Pairing closed');
    socketRef.current = null;
    pendingCandidatesRef.current = [];
    onStream(null);
  };

  useEffect(() => stopSession, []);

  const createPairing = async () => {
    stopSession();
    setPairing(null);
    setQrData('');
    setError('');
    setStatus('creating');
    const generation = sessionGenerationRef.current;

    try {
      const serviceOrigin = normalizeMirrorOrigin(origin);
      localStorage.setItem(MOBILE_MIRROR_ORIGIN_KEY, serviceOrigin);
      const response = await fetch(`${serviceOrigin}/api/rooms`, { method: 'POST' });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
          ? result.error
          : `Could not create a pairing session (${response.status}).`;
        throw new Error(message);
      }
      if (
        !result ||
        typeof result !== 'object' ||
        !('token' in result) ||
        typeof result.token !== 'string' ||
        !('mobileUrl' in result) ||
        typeof result.mobileUrl !== 'string'
      ) {
        throw new Error('The pairing service returned an invalid session.');
      }
      const mobileUrl = new URL(result.mobileUrl);
      if (mobileUrl.origin !== serviceOrigin || mobileUrl.pathname !== '/mobile-share') {
        throw new Error('The pairing service returned an unexpected phone link.');
      }
      const qr = await QRCode.toDataURL(mobileUrl.toString(), {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      if (generation !== sessionGenerationRef.current) return;
      const nextPairing = { token: result.token, mobileUrl: mobileUrl.toString() };
      setPairing(nextPairing);
      setQrData(qr);

      const socket = new WebSocket(makeSignalUrl(serviceOrigin, nextPairing.token, 'desktop'));
      socketRef.current = socket;
      socket.onopen = () => {
        if (generation === sessionGenerationRef.current) setStatus('waiting');
      };
      socket.onmessage = async event => {
        try {
          const message = parseSignal(String(event.data));
          if (message.type === 'peer-ready' && message.role === 'mobile') {
            if (generation !== sessionGenerationRef.current || peerRef.current) return;
            setStatus('connecting');
            const peer = new RTCPeerConnection({ iceServers: await getIceServers(serviceOrigin) });
            peerRef.current = peer;
            peer.addTransceiver('video', { direction: 'recvonly' });
            peer.ontrack = trackEvent => {
              const stream = trackEvent.streams[0] || new MediaStream([trackEvent.track]);
              onStream(stream);
              setStatus('connected');
            };
            peer.onicecandidate = candidateEvent => {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'candidate', candidate: candidateEvent.candidate?.toJSON() ?? null }));
              }
            };
            peer.onconnectionstatechange = () => {
              if (generation !== sessionGenerationRef.current) return;
              if (peer.connectionState === 'connected') setStatus('connected');
              if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
                setStatus('waiting');
                onStream(null);
              }
            };
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.send(JSON.stringify({ type: 'offer', sdp: offer.sdp }));
          } else if (message.type === 'answer') {
            const peer = peerRef.current;
            if (peer) {
              await peer.setRemoteDescription({ type: 'answer', sdp: message.sdp });
              for (const candidate of pendingCandidatesRef.current.splice(0)) {
                await peer.addIceCandidate(candidate);
              }
            }
          } else if (message.type === 'candidate' && message.candidate) {
            const peer = peerRef.current;
            if (peer?.remoteDescription) await peer.addIceCandidate(message.candidate);
            else pendingCandidatesRef.current.push(message.candidate);
          } else if (message.type === 'peer-left') {
            peerRef.current?.close();
            peerRef.current = null;
            pendingCandidatesRef.current = [];
            onStream(null);
            setStatus('waiting');
          }
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'The phone connection could not be negotiated.');
          setStatus('error');
        }
      };
      socket.onerror = () => {
        if (generation === sessionGenerationRef.current) {
          setError('Could not connect to the signaling service. Check its URL and HTTPS availability.');
          setStatus('error');
        }
      };
      socket.onclose = event => {
        if (generation === sessionGenerationRef.current && event.code !== 1000) {
          setError(event.reason || 'The signaling connection closed.');
          setStatus('error');
        }
      };
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create a pairing session.');
      setStatus('error');
    }
  };

  const copyLink = async () => {
    if (!pairing) return;
    try {
      await navigator.clipboard.writeText(pairing.mobileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Clipboard access was denied. Scan the QR code instead.');
    }
  };

  return (
    <section className="w-full max-w-3xl space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-3 text-sky-200">
          <ScreenShare className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-white">Share a phone screen</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Pair over HTTPS. The phone asks for screen-capture permission; video is sent directly between devices and is not stored by this service.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[10px] text-slate-300">
          {status === 'creating' || status === 'connecting'
            ? <LoaderCircle className="h-3 w-3 animate-spin" />
            : status === 'connected'
              ? <Wifi className="h-3 w-3 text-emerald-300" />
              : <Shield className="h-3 w-3 text-sky-200" />}
          <span>{status === 'connected' ? 'Live' : status === 'waiting' ? 'Waiting for phone' : status === 'connecting' ? 'Connecting' : status === 'creating' ? 'Starting' : status === 'error' ? 'Needs attention' : 'Secure pairing'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex-1">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pairing service URL</span>
          <input
            value={origin}
            onChange={event => setOrigin(event.target.value)}
            placeholder="https://your-service.onrender.com"
            inputMode="url"
            autoComplete="url"
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-xs text-white outline-none transition focus:border-sky-300/50 focus:ring-2 focus:ring-sky-300/10"
          />
        </label>
        <button
          onClick={createPairing}
          disabled={status === 'creating' || status === 'connecting' || status === 'connected'}
          className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-sky-500/15 px-4 py-2.5 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <QrCode className="h-4 w-4" />
          Create secure QR
        </button>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{error}</p>}

      {pairing && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:flex-row">
          {qrData
            ? <img src={qrData} alt="Scan to open the phone screen-sharing companion" className="h-40 w-40 rounded-xl bg-white p-2 shadow-lg" />
            : <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-white"><LoaderCircle className="h-6 w-6 animate-spin text-slate-500" /></div>}
          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white sm:justify-start">
              <Smartphone className="h-4 w-4 text-sky-200" />
              Scan with the phone camera
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Open the link on the phone, then tap <strong className="text-slate-200">Start screen sharing</strong> and approve the browser prompt. This pairing link expires in five minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <button onClick={copyLink} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-slate-200 hover:bg-white/10">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <button onClick={() => { stopSession(); setPairing(null); setQrData(''); setStatus('idle'); setError(''); }} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-slate-300 hover:bg-white/10">
                <X className="h-3.5 w-3.5" />
                End pairing
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 text-[10px] leading-relaxed text-slate-400 sm:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><Monitor className="h-3 w-3" /> View only</div>
          Desktop receives the shared screen; it cannot tap or control phone apps.
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><RotateCw className="h-3 w-3" /> Browser support varies</div>
          Screen capture is requested by the phone browser and may not be available on every iOS or Android browser.
        </div>
      </div>
    </section>
  );
};
