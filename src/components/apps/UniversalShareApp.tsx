import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Check, ClipboardCopy, Copy, FileUp, FolderSync, Link2, LoaderCircle, LockKeyhole, QrCode, Send, ShieldCheck, Smartphone, X } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { vfs } from '../../services/virtualFileSystem';
import {
  getIceServers,
  getSavedMirrorOrigin,
  makeSignalUrl,
  normalizeMirrorOrigin,
} from '../../services/mobileMirror';
import type { VirtualFile } from '../../types/desktop';

type ShareStatus = 'idle' | 'creating' | 'waiting' | 'connected' | 'sending' | 'sent' | 'error';
type TransferItem = { name: string; type: string; blob: Blob };

const CHUNK_BYTES = 16 * 1024;
const MAX_TRANSFER_BYTES = 25 * 1024 * 1024;

const waitForBuffer = async (channel: RTCDataChannel) => {
  while (channel.bufferedAmount > 256 * 1024) {
    await new Promise(resolve => window.setTimeout(resolve, 20));
  }
};

const sendItem = async (channel: RTCDataChannel, item: TransferItem, index: number) => {
  const bytes = await item.blob.arrayBuffer();
  channel.send(JSON.stringify({
    type: 'file-start',
    index,
    name: item.name,
    mimeType: item.type || 'application/octet-stream',
    size: bytes.byteLength,
  }));
  for (let offset = 0; offset < bytes.byteLength; offset += CHUNK_BYTES) {
    await waitForBuffer(channel);
    channel.send(bytes.slice(offset, Math.min(offset + CHUNK_BYTES, bytes.byteLength)));
  }
  channel.send(JSON.stringify({ type: 'file-end', index }));
};

export const UniversalShareApp: React.FC = () => {
  const { windows, spaces, activeSpaceId, user, recordActivity } = useOS();
  const [origin, setOrigin] = useState(getSavedMirrorOrigin);
  const [status, setStatus] = useState<ShareStatus>('idle');
  const [error, setError] = useState('');
  const [pairUrl, setPairUrl] = useState('');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [pickedFiles, setPickedFiles] = useState<File[]>([]);
  const [shareText, setShareText] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [vfsFiles, setVfsFiles] = useState<VirtualFile[]>(() => vfs.getAllActiveFiles());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [includeWorkspace, setIncludeWorkspace] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const generationRef = useRef(0);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => vfs.subscribe(() => setVfsFiles(vfs.getAllActiveFiles())), []);
  useEffect(() => () => {
    generationRef.current += 1;
    channelRef.current?.close();
    peerRef.current?.close();
    socketRef.current?.close(1000, 'ARLO Share closed');
    pendingCandidatesRef.current = [];
  }, []);

  const stopSession = () => {
    generationRef.current += 1;
    channelRef.current?.close();
    channelRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    socketRef.current?.close(1000, 'ARLO Share stopped');
    socketRef.current = null;
    pendingCandidatesRef.current = [];
    setPairUrl('');
    setQr('');
    setStatus('idle');
  };

  const createShare = async () => {
    setError('');
    setStatus('creating');
    const generation = ++generationRef.current;
    try {
      const serviceOrigin = normalizeMirrorOrigin(origin);
      localStorage.setItem('abhishek_os_mobile_mirror_origin_v1', serviceOrigin);
      const response = await fetch(`${serviceOrigin}/api/rooms`, { method: 'POST' });
      const result: unknown = await response.json();
      if (!response.ok || !result || typeof result !== 'object' ||
        !('token' in result) || typeof result.token !== 'string' ||
        !('mobileUrl' in result) || typeof result.mobileUrl !== 'string') {
        throw new Error('Could not create an ARLO Share session. Check the pairing service URL and try again.');
      }
      const receiveUrl = new URL(result.mobileUrl);
      if (receiveUrl.origin !== serviceOrigin) throw new Error('The pairing service returned an untrusted receive link.');
      receiveUrl.pathname = '/share-receive';
      const fullUrl = receiveUrl.toString();
      const qrData = await QRCode.toDataURL(fullUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 240,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      if (generation !== generationRef.current) return;
      setPairUrl(fullUrl);
      setQr(qrData);

      const socket = new WebSocket(makeSignalUrl(serviceOrigin, result.token, 'share-sender'));
      socketRef.current = socket;
      socket.onerror = () => {
        if (generation === generationRef.current) {
          setError('Could not reach the pairing service. Verify its URL and network connection.');
          setStatus('error');
        }
      };
      socket.onclose = event => {
        if (generation === generationRef.current && event.code !== 1000) {
          setError(event.reason || 'The ARLO Share session ended.');
          setStatus('error');
        }
      };
      socket.onmessage = async event => {
        const signal = JSON.parse(String(event.data)) as { type?: string; sdp?: string; candidate?: RTCIceCandidateInit | null };
        if (generation !== generationRef.current) return;
        if (signal.type === 'peer-ready' && !peerRef.current) {
          const peer = new RTCPeerConnection({ iceServers: await getIceServers(serviceOrigin) });
          peerRef.current = peer;
          const channel = peer.createDataChannel('arlo-share', { ordered: true });
          channelRef.current = channel;
          channel.onopen = () => setStatus('connected');
          channel.onclose = () => {
            if (generation === generationRef.current) setStatus('waiting');
          };
          peer.onicecandidate = eventCandidate => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'candidate', candidate: eventCandidate.candidate?.toJSON() ?? null }));
            }
          };
          peer.onconnectionstatechange = () => {
            if (peer.connectionState === 'failed') {
              setError('A secure peer-to-peer connection could not be established. Try another network.');
              setStatus('error');
            }
          };
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.send(JSON.stringify({ type: 'offer', sdp: offer.sdp }));
          setStatus('waiting');
        } else if (signal.type === 'answer' && signal.sdp && peerRef.current) {
          await peerRef.current.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
          for (const candidate of pendingCandidatesRef.current.splice(0)) {
            await peerRef.current.addIceCandidate(candidate);
          }
        } else if (signal.type === 'candidate' && signal.candidate) {
          if (peerRef.current?.remoteDescription) await peerRef.current.addIceCandidate(signal.candidate);
          else pendingCandidatesRef.current.push(signal.candidate);
        } else if (signal.type === 'peer-left') {
          setStatus('waiting');
        }
      };
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not start ARLO Share.');
      setStatus('error');
    }
  };

  const createWorkspaceManifest = () => {
    const browserUrls: string[] = (() => {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem('abhishek-browser-history') || '[]');
        return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string').slice(0, 30) : [];
      } catch {
        return [];
      }
    })();
    return {
      format: 'arlo-workspace',
      version: 1,
      exportedAt: new Date().toISOString(),
      user: user.displayName,
      activeDesktop: spaces.find(space => space.id === activeSpaceId)?.name ?? 'Desktop',
      desktops: spaces.map(space => ({ id: space.id, name: space.name })),
      windows: windows.filter(win => !win.isMinimized).map(win => ({
        appId: win.appId,
        title: win.title,
        x: win.x,
        y: win.y,
        width: win.width,
        height: win.height,
        maximized: win.isMaximized,
        desktop: spaces.find(space => space.id === win.desktopSpaceId)?.name ?? 'Desktop',
      })),
      recentBrowserUrls: browserUrls,
      privacy: 'No Ghost AI conversation history is included.',
    };
  };

  const sendSelection = async () => {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== 'open') {
      setError('Connect the receiving device before sending.');
      return;
    }
    setError('');
    setStatus('sending');
    try {
      const items: TransferItem[] = pickedFiles.map(file => ({
        name: file.name,
        type: file.type,
        blob: file,
      }));
      if (shareText.trim()) {
        items.push({
          name: 'Shared-text.txt',
          type: 'text/plain;charset=utf-8',
          blob: new Blob([shareText], { type: 'text/plain;charset=utf-8' }),
        });
      }
      if (shareUrl.trim()) {
        const parsedUrl = new URL(shareUrl.trim());
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Only HTTP and HTTPS links can be shared.');
        }
        items.push({
          name: 'Shared-link.url.txt',
          type: 'text/plain;charset=utf-8',
          blob: new Blob([parsedUrl.toString()], { type: 'text/plain;charset=utf-8' }),
        });
      }
      for (const file of vfsFiles.filter(item => selectedIds.includes(item.id))) {
        const blob = file.mediaBlobId || file.previewUrl
          ? await vfs.readMedia(file)
          : new Blob([file.content ?? ''], { type: 'text/plain;charset=utf-8' });
        items.push({ name: file.name, type: blob.type, blob });
      }
      if (selectedIds.includes('__clipboard__')) {
        const clipboardText = await navigator.clipboard.readText();
        if (!clipboardText) throw new Error('The clipboard does not contain text to share.');
        items.push({
          name: 'Clipboard.txt',
          type: 'text/plain;charset=utf-8',
          blob: new Blob([clipboardText], { type: 'text/plain;charset=utf-8' }),
        });
      }
      if (includeWorkspace) {
        items.unshift({
          name: 'ARLO-workspace.json',
          type: 'application/json',
          blob: new Blob([JSON.stringify(createWorkspaceManifest(), null, 2)], { type: 'application/json' }),
        });
      }
      if (!items.length) throw new Error('Select at least one item to send.');
      const totalBytes = items.reduce((sum, item) => sum + item.blob.size, 0);
      if (totalBytes > MAX_TRANSFER_BYTES) {
        throw new Error('This transfer is larger than 25 MB. Select fewer or smaller items.');
      }
      channel.send(JSON.stringify({ type: 'transfer-start', count: items.length, totalBytes }));
      for (const [index, item] of items.entries()) await sendItem(channel, item, index);
      channel.send(JSON.stringify({ type: 'transfer-complete', count: items.length }));
      setStatus('sent');
      void recordActivity({
        category: 'system',
        title: 'Sent items with ARLO Share',
        details: `${items.length} item(s) · ${Math.round(totalBytes / 1024)} KB`,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The transfer could not be sent.');
      setStatus('error');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pairUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Clipboard access was denied. Scan the QR code instead.');
    }
  };

  const selectableFiles = vfsFiles.filter(file =>
    file.type !== 'folder' && (file.content !== undefined || Boolean(file.mediaBlobId || file.previewUrl)),
  );

  return (
    <main className="h-full min-h-0 overflow-auto bg-[#0a101b] text-slate-100">
      <div className="mx-auto max-w-5xl space-y-5 p-5 sm:p-7">
        <header className="flex flex-wrap items-center gap-4">
          <motion.div whileHover={{ scale: 1.06, rotate: -4 }} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-400/20 text-cyan-200 shadow-[0_0_32px_rgba(56,189,248,.13)]">
            <Send className="h-5 w-5" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">ARLO OS · Peer to peer</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">Universal Share</h1>
            <p className="mt-1 text-xs text-slate-400">Send files, text, links, and a portable workspace snapshot.</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/[0.08] px-3 py-1.5 text-[10px] text-emerald-200">
            <LockKeyhole className="h-3 w-3" /> End-to-end encrypted transport
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
          <section className="space-y-4 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-sky-300/[0.09] p-2.5 text-sky-200"><FileUp className="h-4 w-4" /></div>
              <div>
                <h2 className="text-sm font-semibold">Choose what to send</h2>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">Transfers go directly between paired devices. The pairing service relays connection setup only.</p>
              </div>
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-black/15 px-4 py-5 text-xs text-slate-300 transition hover:border-sky-300/40 hover:bg-sky-300/[0.04]">
              <FileUp className="h-4 w-4 text-sky-200" />
              <span>{pickedFiles.length ? `${pickedFiles.length} file(s) selected` : 'Browse files to send'}</span>
              <input className="sr-only" type="file" multiple onChange={event => setPickedFiles(Array.from(event.target.files ?? []))} />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <textarea value={shareText} onChange={event => setShareText(event.target.value)} maxLength={20_000} placeholder="Share text or a note…" className="min-h-20 resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] text-white outline-none placeholder:text-slate-600 focus:border-sky-300/30" />
              <input value={shareUrl} onChange={event => setShareUrl(event.target.value)} placeholder="https:// link to share" className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-[11px] text-white outline-none placeholder:text-slate-600 focus:border-sky-300/30" />
            </div>
            <button type="button" onClick={() => setSelectedIds(current => current.includes('__clipboard__') ? current.filter(id => id !== '__clipboard__') : [...current, '__clipboard__'])} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[10px] transition ${selectedIds.includes('__clipboard__') ? 'bg-cyan-300/[0.1] text-cyan-100' : 'bg-white/[0.035] text-slate-400 hover:bg-white/[0.06]'}`}>
              <ClipboardCopy className="h-3.5 w-3.5" />{selectedIds.includes('__clipboard__') ? 'Clipboard text will be included' : 'Include clipboard text'}
            </button>
            <div className="max-h-40 space-y-1 overflow-auto pr-1">
              {selectableFiles.map(file => (
                <label key={file.id} className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-[11px] text-slate-300 transition hover:bg-white/[0.04]">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(file.id)}
                    onChange={event => setSelectedIds(current =>
                      event.target.checked ? [...current, file.id] : current.filter(id => id !== file.id),
                    )}
                    className="accent-sky-400"
                  />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="text-[9px] text-slate-500">{Math.ceil(file.size / 1024)} KB</span>
                </label>
              ))}
              {!selectableFiles.length && <p className="px-2 py-1 text-[10px] text-slate-500">No imported ARLO files are available to select.</p>}
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl bg-violet-300/[0.05] p-3 transition hover:bg-violet-300/[0.08]">
              <input type="checkbox" checked={includeWorkspace} onChange={event => setIncludeWorkspace(event.target.checked)} className="mt-0.5 accent-violet-300" />
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-200"><FolderSync className="h-3.5 w-3.5 text-violet-200" /> Include workspace snapshot</span>
                <span className="mt-1 block text-[10px] leading-4 text-slate-500">Open app layout, desktop names, and recent browser URLs. Ghost conversations and file contents are excluded.</span>
              </span>
            </label>
            <button
              type="button"
              onClick={() => void sendSelection()}
              disabled={!['connected', 'sent'].includes(status)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-sky-950/30 transition hover:brightness-110 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {status === 'sending' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {status === 'sent' ? 'Send again' : 'Send securely'}
            </button>
          </section>

          <aside className="space-y-4 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-cyan-200" />
              <h2 className="text-sm font-semibold">Pair a receiving device</h2>
            </div>
            <label className="block text-[10px] font-medium text-slate-400">
              Secure pairing service URL
              <input value={origin} onChange={event => setOrigin(event.target.value)} placeholder="https://your-pairing-service.example" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-white outline-none transition focus:border-cyan-300/30" />
            </label>
            {qr ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-white p-3">
                <img src={qr} alt="Scan to receive with ARLO Share" className="mx-auto aspect-square w-full max-w-52 rounded-xl" />
              </motion.div>
            ) : (
              <div className="flex aspect-square max-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/15 text-center">
                <QrCode className="h-8 w-8 text-slate-600" />
                <p className="mt-3 text-[10px] text-slate-500">Create a one-time QR link</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${status === 'connected' || status === 'sent' ? 'bg-emerald-300' : status === 'error' ? 'bg-rose-300' : 'bg-slate-600'}`} />
              {status === 'creating' ? 'Creating secure session…' : status === 'waiting' ? 'Waiting for receiver…' : status === 'connected' ? 'Device connected securely' : status === 'sending' ? 'Sending directly to device…' : status === 'sent' ? 'Transfer sent' : status === 'error' ? 'Connection needs attention' : 'Not paired'}
            </div>
            {error && <p role="alert" className="rounded-xl bg-rose-300/[0.08] p-2.5 text-[10px] leading-4 text-rose-200">{error}</p>}
            {pairUrl && (
              <div className="flex gap-2">
                <button onClick={() => void copyLink()} className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 px-2 py-2 text-[10px] text-slate-300 transition hover:bg-white/[0.05]">
                  {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied link' : 'Copy receive link'}
                </button>
                <button onClick={stopSession} aria-label="End share session" className="rounded-xl border border-white/10 px-2.5 text-slate-400 transition hover:bg-rose-300/10 hover:text-rose-200"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
            {!pairUrl && (
              <button onClick={() => void createShare()} disabled={status === 'creating'} className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-200/15 bg-cyan-300/[0.08] px-3 py-2.5 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.13] disabled:opacity-50">
                {status === 'creating' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                Create receive link
              </button>
            )}
            <p className="flex items-start gap-1.5 text-[9px] leading-4 text-slate-600"><ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />Payloads travel over encrypted WebRTC data channels and are never uploaded to the pairing service.</p>
            {status === 'sent' && <a href={pairUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[9px] text-cyan-200">Open receiver link <ArrowUpRight className="h-3 w-3" /></a>}
          </aside>
        </div>
        <AnimatePresence>
          {status === 'connected' && (
            <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center text-[10px] text-emerald-200/80">Connected directly to the receiving device.</motion.p>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};
