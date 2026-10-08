import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, FileLock2, HardDrive, ShieldCheck, X } from 'lucide-react';

const RESPONSE_KEY = 'abhishek_os_local_access_response_v2';

export const LocalAccessPrompt: React.FC = () => {
  const [response, setResponse] = useState(() => localStorage.getItem(RESPONSE_KEY));
  const [isOpen, setIsOpen] = useState(() => !localStorage.getItem(RESPONSE_KEY));
  const [isGranting, setIsGranting] = useState(false);
  const [platform, setPlatform] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void window.electronAPI?.platform()
      .then(setPlatform)
      .catch(loadError => {
        console.error('[Finder] Could not detect the desktop platform:', loadError);
      });

    const openPrompt = () => {
      setError('');
      setIsOpen(true);
    };

    window.addEventListener('request-local-access-prompt', openPrompt);
    return () => window.removeEventListener('request-local-access-prompt', openPrompt);
  }, []);

  const defer = () => {
    localStorage.setItem(RESPONSE_KEY, 'deferred');
    setResponse('deferred');
    setIsOpen(false);
    window.dispatchEvent(new Event('local-access-changed'));
  };

  const isMacOS = platform === 'darwin';

  const grantAllDrives = async () => {
    if (!window.electronAPI?.grantAllDrives) {
      setError('Local folder access is available in the installed desktop app.');
      return;
    }

    setIsGranting(true);
    setError('');
    try {
      const drives = await window.electronAPI.grantAllDrives();
      if (drives.length > 0) {
        localStorage.setItem(RESPONSE_KEY, isMacOS ? 'selected-folders' : 'all-drives');
        setResponse('granted');
        setIsOpen(false);
        window.dispatchEvent(new Event('local-access-changed'));
      } else {
        setError(isMacOS
          ? 'Choose one or more folders to grant access.'
          : 'Windows did not report any accessible drives.');
      }
    } catch (grantError) {
      console.error('[Finder] Could not grant local folder access:', grantError);
      setError(isMacOS
        ? 'ARLO OS could not grant access to the selected folders. Try again.'
        : 'ARLO OS could not enable drive access. Try again.');
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="local-access-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-[#101820] text-white shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="border-b border-white/10 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.15),transparent_55%)] px-6 pb-5 pt-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-400/10 text-sky-300">
                <FileLock2 className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-300">Your files, your choice</p>
              <h2 id="local-access-title" className="mt-2 text-xl font-semibold">
                {isMacOS ? 'Let Finder browse selected folders?' : 'Let Finder browse this PC?'}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
                {isMacOS
                  ? 'Choose the folders ARLO OS can browse. You can change this selection later.'
                  : 'Allow ARLO OS to browse files and folders on every accessible drive, including Downloads, Documents, Pictures, Videos, and connected drives.'}
              </p>
            </div>

            <div className="space-y-3 px-6 py-5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>
                  {isMacOS
                    ? 'ARLO OS can access only the folders you choose in the macOS folder picker.'
                    : 'This grants broad local file access. Windows does not show a separate all-files picker for desktop apps, so this consent is what enables Finder to browse every drive.'}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>Files stay in their original locations. Finder reads a folder listing only when you open it; it does not recursively copy or upload file contents.</span>
              </div>
              {error && <p role="alert" className="text-rose-300">{error}</p>}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-white/10 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={defer}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/6 hover:text-white"
              >
                <X className="h-3.5 w-3.5" /> Not now
              </button>
              <button
                type="button"
                onClick={() => void grantAllDrives()}
                disabled={isGranting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-300 disabled:cursor-wait disabled:opacity-70"
              >
                <HardDrive className="h-3.5 w-3.5" />
                {isGranting
                  ? (isMacOS ? 'Choosing folders...' : 'Enabling access...')
                  : (isMacOS ? 'Choose folders' : 'Allow access to all drives')}
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};