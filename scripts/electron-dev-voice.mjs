import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const voiceBuild = spawnSync(
  process.execPath,
  [path.join(projectRoot, 'scripts', 'build-ghost-voice.mjs')],
  { cwd: projectRoot, stdio: 'inherit', windowsHide: true },
);
const voiceReady = !voiceBuild.error && voiceBuild.status === 0;

if (!voiceReady) {
  const reason = voiceBuild.error?.message
    ?? `voice build exited with status ${voiceBuild.status ?? 'unknown'}`;
  console.warn(`[Ghost voice] ${reason}. Starting ARLO OS without local wake-word activation.`);
}

const npmCli = process.env.npm_execpath;
const npmCommand = npmCli
  ? process.execPath
  : process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmArgs = npmCli
  ? [npmCli, 'run', 'electron:dev']
  : ['run', 'electron:dev'];
const appProcess = spawn(npmCommand, npmArgs, {
  cwd: projectRoot,
  stdio: 'inherit',
  windowsHide: false,
  shell: !npmCli && process.platform === 'win32',
});

appProcess.on('error', error => {
  console.error('[ARLO OS] Could not start Electron:', error);
  process.exitCode = 1;
});
appProcess.on('exit', (code, signal) => {
  if (signal) {
    process.exitCode = signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1;
    return;
  }
  process.exitCode = code ?? 1;
});
