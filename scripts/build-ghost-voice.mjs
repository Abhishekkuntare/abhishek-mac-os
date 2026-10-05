import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const voiceRoot = path.join(projectRoot, 'build', 'ghost-voice');
const modelPath = path.join(voiceRoot, 'faster-whisper-base');
const outputPath = path.join(voiceRoot, 'dist');
const stagingOutputPath = path.join(voiceRoot, 'dist-staging');
const executablePath = path.join(outputPath, 'GhostVoice', 'GhostVoice.exe');
const stagingExecutablePath = path.join(stagingOutputPath, 'GhostVoice', 'GhostVoice.exe');
const windowsPythonAliases = process.env.LOCALAPPDATA
  ? ['3.13', '3.12', '3.11', '3.10'].map(version => [
      path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WindowsApps', `python${version}.exe`),
      [],
    ])
  : [];
const pythonCandidates = process.env.PYTHON
  ? [[process.env.PYTHON, []]]
  : [
      ...windowsPythonAliases,
      ['py', ['-3.13']],
      ['py', ['-3.12']],
      ['py', ['-3.11']],
      ['py', ['-3.10']],
      ['python', []],
    ];

const python = pythonCandidates.find(([command, args]) => {
  const check = spawnSync(command, [
    ...args,
    '-c',
    'import PyInstaller, faster_whisper, numpy, sounddevice',
  ], { stdio: 'ignore', windowsHide: true });
  return !check.error && check.status === 0;
});
if (!python) {
  throw new Error(
    'Python voice dependencies are missing. Install them with "python -m pip install -r voice-requirements.txt", using the same Python interpreter that builds the app.',
  );
}
const [pythonCommand, pythonArgs] = python;

if (process.platform !== 'win32') {
  throw new Error('The bundled Ghost voice listener is currently built on Windows only.');
}

await fs.mkdir(voiceRoot, { recursive: true });

try {
  await fs.access(path.join(modelPath, 'model.bin'));
} catch {
  console.log('[Ghost voice] Downloading the offline multilingual Whisper base model for this build...');
  const download = spawnSync(pythonCommand, [
    ...pythonArgs,
    '-c',
    'from faster_whisper.utils import download_model; print(download_model("base"))',
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], windowsHide: true });
  if (download.error) throw download.error;
  if (download.status !== 0) throw new Error('Could not download the offline multilingual speech model.');
  const cachedModelPath = download.stdout.trim().split(/\r?\n/).at(-1);
  if (!cachedModelPath) throw new Error('The offline multilingual speech model download returned no path.');
  await fs.rm(modelPath, { recursive: true, force: true });
  await fs.cp(cachedModelPath, modelPath, { recursive: true, dereference: true });
}

const buildInputs = [
  path.join(projectRoot, 'scripts', 'ghost_voice.py'),
  path.join(projectRoot, 'scripts', 'build-ghost-voice.mjs'),
  path.join(projectRoot, 'voice-requirements.txt'),
  path.join(modelPath, 'model.bin'),
  path.join(modelPath, 'config.json'),
];
const executableStat = await fs.stat(executablePath).catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});
const inputStats = await Promise.all(buildInputs.map(input => fs.stat(input)));
const isCurrent = executableStat && inputStats.every(input => input.mtimeMs <= executableStat.mtimeMs);

if (!isCurrent) {
  await fs.rm(stagingOutputPath, { recursive: true, force: true });
  await fs.mkdir(stagingOutputPath, { recursive: true });

  const addData = `${modelPath};model`;
  const build = spawnSync(pythonCommand, [
    ...pythonArgs,
    '-m',
    'PyInstaller',
    '--noconfirm',
    '--clean',
    '--name',
    'GhostVoice',
    '--collect-all',
    'faster_whisper',
    '--collect-all',
    'ctranslate2',
    '--collect-all',
    'tokenizers',
    '--collect-all',
    'av',
    '--collect-all',
    'huggingface_hub',
    '--collect-all',
    'numpy',
    '--collect-all',
    'sounddevice',
    '--add-data',
    addData,
    '--distpath',
    stagingOutputPath,
    '--workpath',
    path.join(voiceRoot, 'work-staging'),
    '--specpath',
    path.join(voiceRoot, 'spec-staging'),
    path.join(projectRoot, 'scripts', 'ghost_voice.py'),
  ], { cwd: projectRoot, stdio: 'inherit', windowsHide: true });

  if (build.error) throw build.error;
  if (build.status !== 0) {
    throw new Error(
      `Could not build GhostVoice.exe. Install the voice dependencies with "${pythonCommand} ${pythonArgs.join(' ')} -m pip install -r voice-requirements.txt".`,
    );
  }
  await fs.access(stagingExecutablePath);

  let previousOutputPath;
  try {
    previousOutputPath = path.join(voiceRoot, `dist-previous-${Date.now()}`);
    await fs.rename(outputPath, previousOutputPath);
  } catch (error) {
    if (error.code === 'ENOENT') previousOutputPath = undefined;
    else {
      throw new Error(
        'The voice listener was built, but the existing output is in use. Close ARLO OS and run "npm run build:voice" again.',
        { cause: error },
      );
    }
  }
  try {
    await fs.rename(stagingOutputPath, outputPath);
  } catch (error) {
    if (previousOutputPath) {
      await fs.rename(previousOutputPath, outputPath).catch(restoreError => {
        console.error('[Ghost voice] Could not restore the previous listener output:', restoreError);
      });
    }
    throw error;
  }
  if (previousOutputPath) await fs.rm(previousOutputPath, { recursive: true, force: true });
} else {
  console.log('[Ghost voice] Bundled listener is up to date.');
}
await fs.access(executablePath);
console.log(`[Ghost voice] Bundled offline listener: ${executablePath}`);
