import React, { useEffect, useRef, useState } from 'react';
import { Check, CircleAlert, LoaderCircle, Monitor, ShieldCheck, Smartphone, Square, Video } from 'lucide-react';
import {
  getIceServers,
  makeSignalUrl,
  type MobileMirrorSignal,
} from '../../services/mobileMirror';

type ShareState = 'ready' | 'requesting' | 'connecting' | 'sharing' | 'error';

const readSignal = (data: string): MobileMirrorSignal => {
  const message: unknown = JSON.parse(data);
  if (!message || typeof message !== 'object' || !('type' in message)) {
    throw new Error('The desktop sent an invalid connection message.');
  }
  return message as MobileMirrorSignal;
};

const answerOffer = async (
  sdp: string,
  peer: RTCPeerConnection,
  socket: WebSocket,
  pendingCandidates: RTCIceCandidateInit[],
) => {
  await peer.setRemoteDescription({ type: 'offer', sdp });
  for (const candidate of pendingCandidates.splice(0)) {
    await peer.addIceCandidate(candidate);
  }
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.send(JSON.stringify({ type: 'answer', sdp: answer.sdp }));
};

export const MobileShareApp: React.FC = () => {
  const roomToken = new URLSearchParams(window.location.search).get('room') || '';
  const [state, setState] = useState<ShareState>('ready');
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(false);
  const [sharing, setSharing] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingOfferRef = useRef<string | null>(null);
  const localCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const generationRef = useRef(0);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Phone screen sharing — Abhishek OS';
    setSupported(typeof navigator.mediaDevices?.getDisplayMedia === 'function' && window.isSecureContext);
    return () => {
      stopSharing();
      document.title = previousTitle;
    };
  }, []);

  const stopSharing = () => {
    generationRef.current += 1;
    peerRef.current?.close();
    peerRef.current = null;
    socketRef.current?.close(1000, 'Screen sharing stopped');
    socketRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    localCandidatesRef.current = [];
    setSharing(false);
  };

  const startSharing = async () => {
    if (!roomToken) {
      setError('This pairing link is missing its session code. Scan a new QR from the desktop.');
      setState('error');
      return;
    }
    if (typeof navigator.mediaDevices?.getDisplayMedia !== 'function' || !window.isSecureContext) {
      setError('This browser cannot capture a screen here. Use a supported browser on the HTTPS companion page.');
      setState('error');
      return;
    }

    setError('');
    setState('requesting');
    const generation = generationRef.current + 1;
    generationRef.current = generation;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      if (generation !== generationRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      stream.getVideoTracks()[0]?.addEventListener('ended', stopSharing, { once: true });
      setSharing(true);
      setState('connecting');

      const serviceOrigin = window.location.origin;
      const socket = new WebSocket(makeSignalUrl(serviceOrigin, roomToken, 'mobile'));
      socketRef.current = socket;
      socket.onerror = () => {
        if (generation === generationRef.current) {
          setError('Could not reach the pairing service. Check your internet connection and scan a fresh QR.');
          setState('error');
          stopSharing();
        }
      };
      socket.onclose = event => {
        if (generation === generationRef.current && event.code !== 1000) {
          setError(event.reason || 'The pairing session ended. Scan a fresh QR to reconnect.');
          setState('error');
          stopSharing();
        }
      };
      socket.onopen = async () => {
        try {
          const peer = new RTCPeerConnection({ iceServers: await getIceServers(serviceOrigin) });
          peerRef.current = peer;
          stream.getTracks().forEach(track => peer.addTrack(track, stream));
          peer.onicecandidate = candidateEvent => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'candidate', candidate: candidateEvent.candidate?.toJSON() ?? null }));
            } else if (candidateEvent.candidate) {
              localCandidatesRef.current.push(candidateEvent.candidate.toJSON());
            }
          };
          peer.onconnectionstatechange = () => {
            if (generation !== generationRef.current) return;
            if (peer.connectionState === 'connected') setState('sharing');
            if (peer.connectionState === 'failed') {
              setError('A direct video connection could not be established on this network. Try another network.');
              setState('error');
              stopSharing();
            }
          };
          for (const candidate of localCandidatesRef.current.splice(0)) {
            socket.send(JSON.stringify({ type: 'candidate', candidate }));
          }
          if (pendingOfferRef.current) {
            const offer = pendingOfferRef.current;
            pendingOfferRef.current = null;
            await answerOffer(offer, peer, socket, pendingCandidatesRef.current);
          }
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Could not initialize screen sharing.');
          setState('error');
          stopSharing();
        }
      };
      socket.onmessage = async event => {
        try {
          const message = readSignal(String(event.data));
          if (message.type === 'offer') {
            const peer = peerRef.current;
            if (!peer) pendingOfferRef.current = message.sdp;
            else await answerOffer(message.sdp, peer, socket, pendingCandidatesRef.current);
          } else if (message.type === 'candidate' && message.candidate) {
            const peer = peerRef.current;
            if (peer?.remoteDescription) await peer.addIceCandidate(message.candidate);
            else pendingCandidatesRef.current.push(message.candidate);
          } else if (message.type === 'peer-left') {
            setError('The desktop ended the pairing session.');
            setState('error');
            stopSharing();
          }
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'The screen-sharing connection failed.');
          setState('error');
          stopSharing();
        }
      };
    } catch (caught) {
      const errorName = caught instanceof DOMException ? caught.name : '';
      const message = errorName === 'NotAllowedError'
        ? 'Screen sharing was cancelled or permission was denied.'
        : errorName === 'NotFoundError'
          ? 'No screen or window is available to share.'
          : caught instanceof Error
            ? caught.message
            : 'Could not start screen sharing.';
      setError(message);
      setState('error');
      stopSharing();
    }
  };

  const statusLabel = state === 'requesting' ? 'Waiting for permission'
    : state === 'connecting' ? 'Connecting securely'
      : state === 'sharing' ? 'Sharing screen'
        : state === 'error' ? 'Needs attention'
          : 'Ready to connect';

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.18),_transparent_45%),linear-gradient(150deg,#070b18,#111827_55%,#090d1a)] px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-lg flex-col justify-center">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-3 text-sky-200"><Smartphone className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/70">Abhishek OS</p>
            <h1 className="mt-1 text-xl font-bold">Phone screen sharing</h1>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            {state === 'requesting' || state === 'connecting'
              ? <LoaderCircle className="h-4 w-4 animate-spin text-sky-200" />
              : state === 'sharing'
                ? <Check className="h-4 w-4 text-emerald-300" />
                : state === 'error'
                  ? <CircleAlert className="h-4 w-4 text-rose-300" />
                  : <ShieldCheck className="h-4 w-4 text-sky-200" />}
            {statusLabel}
          </div>

          {sharing && (
            <div className="my-5 overflow-hidden rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-300" /></span>
                <span className="text-sm font-semibold text-emerald-100">Screen is being shared</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">Your screen is visible to the paired desktop. You can stop sharing at any time here or from the browser indicator.</p>
            </div>
          )}

          {error && <p role="alert" className="my-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-3 text-xs leading-relaxed text-rose-100">{error}</p>}

          {!roomToken ? (
            <div className="my-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-xs leading-relaxed text-amber-100">
              This link has no valid pairing session. Return to the desktop and scan a newly generated QR code.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <button
                onClick={sharing ? stopSharing : startSharing}
                disabled={!supported || state === 'requesting' || state === 'connecting'}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${sharing ? 'border border-rose-300/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20' : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-900/30 hover:brightness-110'}`}
              >
                {sharing ? <Square className="h-4 w-4" /> : state === 'requesting' || state === 'connecting' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                {sharing ? 'Stop sharing' : 'Start screen sharing'}
              </button>
              <p className="text-center text-[11px] leading-relaxed text-slate-400">
                Your browser will ask you to choose what to share. Select your screen and keep this page open while connected.
              </p>
            </div>
          )}

          {!supported && roomToken && (
            <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3 text-[11px] leading-relaxed text-amber-100">
              Screen capture is unavailable in this browser or page context. Use a supported browser and an HTTPS address.
            </p>
          )}

          <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
            <div className="rounded-xl bg-white/[0.04] p-3 text-[10px] leading-relaxed text-slate-400">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><Monitor className="h-3 w-3" /> View only</div>
              The desktop can see the shared screen but cannot touch or control this phone.
            </div>
            <div className="rounded-xl bg-white/[0.04] p-3 text-[10px] leading-relaxed text-slate-400">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200"><ShieldCheck className="h-3 w-3" /> Private transport</div>
              Screen video travels peer-to-peer with WebRTC encryption; the signaling service does not store video.
            </div>
          </div>
        </section>
        <p className="mt-5 text-center text-[10px] leading-relaxed text-slate-500">
          Screen sharing is controlled by the browser and operating system. Support varies by device and browser.
        </p>
      </div>
    </main>
  );
};
