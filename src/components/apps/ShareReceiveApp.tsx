import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, CircleAlert, Download, LoaderCircle, LockKeyhole, MonitorDown, ShieldCheck } from 'lucide-react';
import { getIceServers, makeSignalUrl } from '../../services/mobileMirror';

type IncomingFile = { index: number; name: string; mimeType: string; size: number };

export const ShareReceiveApp: React.FC = () => {
  const room = new URLSearchParams(window.location.search).get('room') ?? '';
  const [status, setStatus] = useState<'ready' | 'connecting' | 'connected' | 'receiving' | 'done' | 'error'>('ready');
  const [error, setError] = useState('');
  const [received, setReceived] = useState<string[]>([]);
  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const incomingRef = useRef<IncomingFile | null>(null);
  const chunksRef = useRef<ArrayBuffer[]>([]);
  const generationRef = useRef(0);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => () => {
    generationRef.current += 1;
    peerRef.current?.close();
    socketRef.current?.close(1000, 'ARLO Share receiver closed');
    pendingCandidatesRef.current = [];
  }, []);

  const connect = async () => {
    if (!/^[\w-]{20,100}$/.test(room)) {
      setError('This receive link is invalid or expired. Ask the sender for a new link.');
      setStatus('error');
      return;
    }
    setError('');
    setStatus('connecting');
    const generation = ++generationRef.current;
    try {
      const origin = window.location.origin;
      const socket = new WebSocket(makeSignalUrl(origin, room, 'share-receiver'));
      socketRef.current = socket;
      socket.onerror = () => {
        if (generation === generationRef.current) {
          setError('Could not connect to the pairing service. Ask the sender to create a new link.');
          setStatus('error');
        }
      };
      socket.onmessage = async event => {
        try {
          const signal = JSON.parse(String(event.data)) as { type?: string; role?: string; sdp?: string; candidate?: RTCIceCandidateInit | null };
          if (generation !== generationRef.current) return;
          if (signal.type === 'peer-ready' && !peerRef.current) {
            const peer = new RTCPeerConnection({ iceServers: await getIceServers(origin) });
            peerRef.current = peer;
            peer.ondatachannel = channelEvent => {
              const channel = channelEvent.channel;
              channel.binaryType = 'arraybuffer';
              channel.onopen = () => setStatus('connected');
              channel.onmessage = async messageEvent => {
                if (typeof messageEvent.data === 'string') {
                  const message = JSON.parse(messageEvent.data) as {
                    type?: string; count?: number; name?: string; mimeType?: string; size?: number;
                    index?: number;
                  };
                  if (message.type === 'transfer-start') setStatus('receiving');
                  if (message.type === 'file-start' && typeof message.name === 'string') {
                    incomingRef.current = {
                      index: Number(message.index),
                      name: message.name,
                      mimeType: message.mimeType || 'application/octet-stream',
                      size: Number(message.size) || 0,
                    };
                    chunksRef.current = [];
                  }
                  if (message.type === 'file-end' && incomingRef.current) {
                    const file = incomingRef.current;
                    const blob = new Blob(chunksRef.current, { type: file.mimeType });
                    if (blob.size !== file.size) {
                      throw new Error(`The received file "${file.name}" was incomplete.`);
                    }
                    if (file.name === 'ARLO-workspace.json') {
                      const text = await blob.text();
                      const parsed: unknown = JSON.parse(text);
                      if (!parsed || typeof parsed !== 'object' || !('format' in parsed) || parsed.format !== 'arlo-workspace') {
                        throw new Error('The workspace file is invalid.');
                      }
                      setWorkspace(parsed as Record<string, unknown>);
                    }
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.name;
                    link.click();
                    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
                    setReceived(current => [...current, file.name]);
                    incomingRef.current = null;
                    chunksRef.current = [];
                  }
                  if (message.type === 'transfer-complete') setStatus('done');
                } else if (messageEvent.data instanceof ArrayBuffer) {
                  chunksRef.current.push(messageEvent.data);
                } else if (messageEvent.data instanceof Blob) {
                  void messageEvent.data.arrayBuffer().then(buffer => chunksRef.current.push(buffer));
                }
              };
            };
            peer.onicecandidate = candidateEvent => {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'candidate', candidate: candidateEvent.candidate?.toJSON() ?? null }));
              }
            };
            peer.onconnectionstatechange = () => {
              if (peer.connectionState === 'failed') {
                setError('A secure peer-to-peer connection could not be established. Try another network.');
                setStatus('error');
              }
            };
            setStatus('connecting');
          } else if (signal.type === 'offer' && signal.sdp && peerRef.current) {
            await peerRef.current.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
            for (const candidate of pendingCandidatesRef.current.splice(0)) {
              await peerRef.current.addIceCandidate(candidate);
            }
            const answer = await peerRef.current.createAnswer();
            await peerRef.current.setLocalDescription(answer);
            socket.send(JSON.stringify({ type: 'answer', sdp: answer.sdp }));
          } else if (signal.type === 'candidate' && signal.candidate) {
            if (peerRef.current?.remoteDescription) await peerRef.current.addIceCandidate(signal.candidate);
            else pendingCandidatesRef.current.push(signal.candidate);
          } else if (signal.type === 'peer-left') {
            setStatus(current => current === 'done' ? current : 'ready');
          }
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'The incoming transfer could not be read.');
          setStatus('error');
        }
      };
      socket.onclose = event => {
        if (generation === generationRef.current && event.code !== 1000 && status !== 'done') {
          setError(event.reason || 'This share link has expired.');
          setStatus('error');
        }
      };
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not connect to this share link.');
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.16),_transparent_42%),linear-gradient(150deg,#080d18,#111827_55%,#090d1a)] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-xl flex-col justify-center">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-white/10 bg-slate-900/75 p-6 shadow-[0_30px_100px_rgba(0,0,0,.42)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-300/[0.1] p-3 text-cyan-100"><MonitorDown className="h-6 w-6" /></div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-cyan-100/65">ARLO OS</p>
              <h1 className="mt-1 text-xl font-bold">Receive with ARLO Share</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/[0.04] p-3 text-xs text-slate-300">
            {status === 'connecting' ? <LoaderCircle className="h-4 w-4 animate-spin text-cyan-200" />
              : status === 'done' ? <Check className="h-4 w-4 text-emerald-300" />
                : status === 'error' ? <CircleAlert className="h-4 w-4 text-rose-300" />
                  : <LockKeyhole className="h-4 w-4 text-cyan-200" />}
            {status === 'ready' ? 'A device is ready to share directly with you.'
              : status === 'connecting' ? 'Connecting securely…'
                : status === 'connected' ? 'Connected. Waiting for selected items…'
                  : status === 'receiving' ? 'Receiving files directly…'
                    : status === 'done' ? 'Transfer complete. Files were saved by your browser.'
                      : 'Connection needs attention'}
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-rose-300/[0.08] p-3 text-xs leading-5 text-rose-100">{error}</p>}
          {received.length > 0 && <div className="mt-4 space-y-1 rounded-2xl bg-emerald-300/[0.06] p-3">{received.map(name => <p key={name} className="flex items-center gap-2 text-[11px] text-emerald-100"><Download className="h-3 w-3" />{name}</p>)}</div>}
          {workspace && (
            <div className="mt-4 rounded-2xl border border-violet-200/10 bg-violet-300/[0.05] p-4">
              <p className="text-xs font-semibold text-violet-100">Workspace snapshot received</p>
              <p className="mt-1 text-[10px] text-slate-400">{Array.isArray(workspace.windows) ? workspace.windows.length : 0} open-window record(s) · {Array.isArray(workspace.recentBrowserUrls) ? workspace.recentBrowserUrls.length : 0} recent browser link(s)</p>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">Saved as ARLO-workspace.json. It contains workspace structure only, not Ghost AI conversations or file contents.</p>
            </div>
          )}
          <button onClick={() => void connect()} disabled={status === 'connecting' || status === 'connected' || status === 'receiving'} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
            {status === 'connecting' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MonitorDown className="h-4 w-4" />}
            {status === 'done' ? 'Receive another item' : 'Connect to sender'}
          </button>
          <p className="mt-4 flex items-start gap-2 text-[10px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300/70" />Files travel over an encrypted direct connection. The pairing service handles setup only; it does not receive your files.</p>
        </motion.section>
        <AnimatePresence>{status === 'done' && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 text-center text-[10px] text-slate-500">You can close this page now.</motion.p>}</AnimatePresence>
      </div>
    </main>
  );
};
