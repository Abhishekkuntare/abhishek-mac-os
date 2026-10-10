
import {
  app,
  BrowserWindow,
  dialog,
  shell,
  ipcMain,
  nativeTheme,
  clipboard,
  globalShortcut,
  net,
  protocol,
  safeStorage,
} from 'electron';

import electronUpdater from 'electron-updater';
import dotenv from 'dotenv';
import {
  GHOST_GEMINI_MODEL,
  GHOST_REGISTERED_CAPABILITY_NAMES,
  GHOST_TOOL_DECLARATIONS,
  isValidGhostToolResults,
  runGhostAgent,
} from './ghost-agent-service.mjs';



import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import http from 'node:http';
import { installCodeRuntime, runCode } from './code-runner.mjs';
import { resolveGeminiApiKey } from './ghost-api-key.mjs';

const { autoUpdater } = electronUpdater;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dotenvResult = dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });
const dotenvGeminiApiKey = dotenvResult.parsed?.GEMINI_API_KEY ?? '';

const isDev = !app.isPackaged;
const isStorePackage = process.windowsStore;
protocol.registerSchemesAsPrivileged([{
  scheme: 'abhishek-local',
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    corsEnabled: true,
    stream: true,
  },
}]);

let mainWindow = null;
let activeGhostShortcut = '';
let pendingGhostToggle = false;
let ghostWakeProcess = null;
let ghostWakeStopping = false;
let ghostWakeStatus = 'stopped';
const ghostWakeStateWaiters = new Set();
const ghostChatControllers = new Map();
let viteProcess = null;
let pendingBluetoothSelection = null;
let previousCpuTimes = null;
let localTrashOperation = Promise.resolve();
let hostMediaWatchProcess = null;
let hostMediaWatchBuffer = '';
let hostMediaWatchStopping = false;
let hostMediaState = { brightness: null, volume: null };
let notchDeviceWatchProcess = null;
let notchDeviceWatchBuffer = '';
let notchDeviceWatchStopping = false;
let notchClipboardWatchTimer = null;
let notchClipboardLastText = null;
let notchClipboardReadWarningShown = false;
const execFileAsync = promisify(execFile);
const readCpuTimes = () => os.cpus().reduce((total, cpu) => {
  Object.keys(cpu.times).forEach(key => {
    total[key] = (total[key] || 0) + cpu.times[key];
  });
  return total;
}, {});

const sendWindowsMediaCommand = async command => {
  if (process.platform !== 'win32') {
    throw new Error('Windows media-key controls are only available on Windows.');
  }
  const virtualKey = {
    previous: 0xB1,
    playPause: 0xB3,
    next: 0xB0,
  }[command];
  if (!virtualKey) throw new Error('Unsupported media command.');
  const script = `$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class ArloMediaKeys {
  [DllImport("user32.dll")]
  private static extern void keybd_event(byte virtualKey, byte scanCode, uint flags, UIntPtr extraInfo);
  public static void Send(byte virtualKey) {
    keybd_event(virtualKey, 0, 0, UIntPtr.Zero);
    keybd_event(virtualKey, 0, 2, UIntPtr.Zero);
  }
}
'@
[ArloMediaKeys]::Send(${virtualKey})`;
  await execFileAsync('powershell.exe', [
    '-NoLogo',
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    script,
  ], { timeout: 5000, windowsHide: true });
};

const startHostMediaWatcher = () => {
  if (process.platform !== 'win32' || hostMediaWatchProcess) return;

  const script = String.raw`$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

[ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioDeviceEnumerator {
  [PreserveSig] int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr devices);
  [PreserveSig] int GetDefaultAudioEndpoint(int dataFlow, int role, out IAudioDevice device);
}

[ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioDevice {
  [PreserveSig] int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.Interface)] out IAudioEndpointVolume endpoint);
}

[ComImport, Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioEndpointVolume {
  [PreserveSig] int RegisterControlChangeNotify(IntPtr notify);
  [PreserveSig] int UnregisterControlChangeNotify(IntPtr notify);
  [PreserveSig] int GetChannelCount(out uint count);
  [PreserveSig] int SetMasterVolumeLevel(float level, ref Guid context);
  [PreserveSig] int SetMasterVolumeLevelScalar(float level, ref Guid context);
  [PreserveSig] int GetMasterVolumeLevel(out float level);
  [PreserveSig] int GetMasterVolumeLevelScalar(out float level);
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
public class AudioDeviceEnumerator {}

public static class HostMediaStateReader {
  private static IAudioEndpointVolume endpoint;

  public static int ReadVolumePercent() {
    try {
      if (endpoint == null) {
        var enumerator = (IAudioDeviceEnumerator)new AudioDeviceEnumerator();
        IAudioDevice device;
        if (enumerator.GetDefaultAudioEndpoint(0, 1, out device) != 0) return -1;
        var iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
        if (device.Activate(ref iid, 23, IntPtr.Zero, out endpoint) != 0) return -1;
      }
      float value;
      return endpoint.GetMasterVolumeLevelScalar(out value) == 0
        ? (int)Math.Round(value * 100)
        : -1;
    } catch {
      endpoint = null;
      return -1;
    }
  }
}
'@

$lastBrightness = -1
$lastVolume = -1
while ($true) {
  $brightness = $null
  $volume = $null
  try {
    $monitor = Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness | Select-Object -First 1
    if ($null -ne $monitor) { $brightness = [int]$monitor.CurrentBrightness }
  } catch {}
  try {
    $volumePercent = [HostMediaStateReader]::ReadVolumePercent()
    if ($volumePercent -ge 0) { $volume = [int]$volumePercent }
  } catch {}

  if (($null -ne $brightness -and $brightness -ne $lastBrightness) -or
      ($null -ne $volume -and $volume -ne $lastVolume)) {
    [pscustomobject]@{ brightness = $brightness; volume = $volume } | ConvertTo-Json -Compress
    if ($null -ne $brightness) { $lastBrightness = $brightness }
    if ($null -ne $volume) { $lastVolume = $volume }
  }
  Start-Sleep -Milliseconds 300
}`;

  const watcher = spawn('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    script,
  ], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  hostMediaWatchProcess = watcher;
  hostMediaWatchBuffer = '';
  watcher.stdout.setEncoding('utf8');
  watcher.stdout.on('data', chunk => {
    hostMediaWatchBuffer += chunk;
    const lines = hostMediaWatchBuffer.split(/\r?\n/);
    hostMediaWatchBuffer = lines.pop() || '';
    lines.forEach(line => {
      if (!line.trim() || !mainWindow || mainWindow.isDestroyed()) return;
      try {
        const state = JSON.parse(line);
        hostMediaState = {
          brightness: Number.isFinite(state.brightness) ? Math.max(0, Math.min(100, state.brightness)) : null,
          volume: Number.isFinite(state.volume) ? Math.max(0, Math.min(100, state.volume)) : null,
        };
        mainWindow.webContents.send('system:media-state', hostMediaState);
      } catch (error) {
        console.warn('[ARLO OS] Ignoring invalid host media state:', error);
      }
    });
  });
  watcher.stderr.setEncoding('utf8');
  watcher.stderr.on('data', chunk => {
    const message = String(chunk).trim();
    if (message) console.warn('[ARLO OS] Host media watcher:', message);
  });
  watcher.on('error', error => {
    if (hostMediaWatchProcess === watcher) hostMediaWatchProcess = null;
    console.warn('[ARLO OS] Could not start host media watcher:', error);
  });
  watcher.on('exit', (code, signal) => {
    if (hostMediaWatchProcess === watcher) hostMediaWatchProcess = null;
    if (code !== 0 && !hostMediaWatchStopping) {
      console.warn('[ARLO OS] Host media watcher stopped unexpectedly:', { code, signal });
    }
  });
};
const startNotchDeviceWatcher = () => {
  if (process.platform !== 'win32' || notchDeviceWatchProcess) return;

  const script = String.raw`$ErrorActionPreference = 'Stop'
$previousDevices = @{}
$previousPower = $null
$initialized = $false
while ($true) {
  $currentDevices = @{}
  try {
    Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | ForEach-Object {
      $name = [string]$_.FriendlyName
      $class = [string]$_.Class
      $instance = [string]$_.InstanceId
      $kind = $null
      if ($class -eq 'Monitor') { $kind = 'display' }
      elseif ($name -match 'headphone|earbud|earphone|headset') { $kind = 'headphones' }
      elseif ($name -match 'gamepad|game controller|xbox|joystick|controller') { $kind = 'controller' }
      elseif ($class -match 'DiskDrive|WPD' -and $instance -match '^USB\\') { $kind = 'storage' }
      elseif ($class -match 'Bluetooth' -or $instance -match '^(BTH|BTHLE)\\') { $kind = 'bluetooth' }
      elseif ($instance -match '^USB\\' -and $name -notmatch 'root hub|host controller') { $kind = 'usb' }
      if ($kind -and $instance) {
        $currentDevices["$kind|$instance"] = @{ kind = $kind; deviceName = $(if ($name) { $name } else { $kind }) }
      }
    }
  } catch {}

  $power = $null
  try {
    $battery = Get-CimInstance -Namespace root/WMI -ClassName BatteryStatus -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $battery) { $power = [bool]$battery.PowerOnline }
  } catch {}

  if ($initialized) {
    foreach ($key in $currentDevices.Keys) {
      if (-not $previousDevices.ContainsKey($key)) {
        $device = $currentDevices[$key]
        [pscustomobject]@{ kind = $device.kind; deviceName = $device.deviceName; connected = $true } | ConvertTo-Json -Compress
      }
    }
    foreach ($key in $previousDevices.Keys) {
      if (-not $currentDevices.ContainsKey($key)) {
        $device = $previousDevices[$key]
        [pscustomobject]@{ kind = $device.kind; deviceName = $device.deviceName; connected = $false } | ConvertTo-Json -Compress
      }
    }
    if ($null -ne $power -and $null -ne $previousPower -and $power -ne $previousPower) {
      [pscustomobject]@{ kind = 'power'; deviceName = 'Charger'; connected = $power } | ConvertTo-Json -Compress
    }
  }
  $previousDevices = $currentDevices
  if ($null -ne $power) { $previousPower = $power }
  $initialized = $true
  Start-Sleep -Seconds 2
}`;
  const watcher = spawn('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    script,
  ], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  notchDeviceWatchProcess = watcher;
  notchDeviceWatchBuffer = '';
  watcher.stdout.setEncoding('utf8');
  watcher.stdout.on('data', chunk => {
    notchDeviceWatchBuffer += chunk;
    const lines = notchDeviceWatchBuffer.split(/\r?\n/);
    notchDeviceWatchBuffer = lines.pop() || '';
    lines.forEach(line => {
      if (!line.trim() || !mainWindow || mainWindow.isDestroyed()) return;
      try {
        const activity = JSON.parse(line);
        if (typeof activity.kind !== 'string' || typeof activity.deviceName !== 'string' || typeof activity.connected !== 'boolean') {
          throw new Error('Invalid device activity shape.');
        }
        mainWindow.webContents.send('system:notch-device-activity', activity);
      } catch (error) {
        console.warn('[ARLO OS] Ignoring invalid notch device activity:', error);
      }
    });
  });
  watcher.stderr.setEncoding('utf8');
  watcher.stderr.on('data', chunk => {
    const message = String(chunk).trim();
    if (message) console.warn('[ARLO OS] Notch device watcher:', message);
  });
  watcher.on('error', error => {
    if (notchDeviceWatchProcess === watcher) notchDeviceWatchProcess = null;
    console.warn('[ARLO OS] Could not start notch device watcher:', error);
  });
  watcher.on('exit', (code, signal) => {
    if (notchDeviceWatchProcess === watcher) notchDeviceWatchProcess = null;
    if (code !== 0 && !notchDeviceWatchStopping) {
      console.warn('[ARLO OS] Notch device watcher stopped unexpectedly:', { code, signal });
    }
    notchDeviceWatchStopping = false;
  });
};
const stopNotchDeviceWatcher = () => {
  if (!notchDeviceWatchProcess) return;
  notchDeviceWatchStopping = true;
  notchDeviceWatchProcess.kill();
  notchDeviceWatchProcess = null;
  notchDeviceWatchBuffer = '';
};
const startNotchClipboardWatcher = () => {
  if (notchClipboardWatchTimer !== null) return;
  const initialText = clipboard.readText();
  if (typeof initialText === 'string') {
    notchClipboardLastText = initialText;
  } else {
    notchClipboardLastText = null;
    notchClipboardReadWarningShown = true;
    console.error('[ARLO OS] Clipboard returned a non-text value; ignoring it.');
  }
  notchClipboardWatchTimer = setInterval(() => {
    const text = clipboard.readText();
    if (typeof text !== 'string') {
      if (!notchClipboardReadWarningShown) {
        console.error('[ARLO OS] Clipboard returned a non-text value; ignoring it.');
        notchClipboardReadWarningShown = true;
      }
      return;
    }
    notchClipboardReadWarningShown = false;
    if (text === notchClipboardLastText) return;
    notchClipboardLastText = text;
    if (!text || !mainWindow || mainWindow.isDestroyed()) return;
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 120);
    mainWindow.webContents.send('system:notch-clipboard-activity', { preview });
  }, 700);
};
const stopNotchClipboardWatcher = () => {
  if (notchClipboardWatchTimer === null) return;
  clearInterval(notchClipboardWatchTimer);
  notchClipboardWatchTimer = null;
  notchClipboardLastText = null;
  notchClipboardReadWarningShown = false;
};
const localFoldersFile = () => path.join(app.getPath('userData'), 'local-folders.json');
const fullAccessFile = () => path.join(app.getPath('userData'), 'full-filesystem-access.json');
const appTrashDirectory = () => path.join(app.getPath('userData'), 'file-trash');
const appTrashManifest = () => path.join(app.getPath('userData'), 'file-trash.json');
const geminiApiKeyFile = () => path.join(app.getPath('userData'), 'gemini-api-key.enc');
const ghostVoiceExecutable = () => app.isPackaged
  ? path.join(process.resourcesPath, 'ghost-voice', 'GhostVoice.exe')
  : path.join(__dirname, 'build', 'ghost-voice', 'dist', 'GhostVoice', 'GhostVoice.exe');
const assertTrustedFilesFrame = event => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Local file access is only available to the ARLO OS desktop window.');
  }
};

const GHOST_SHORTCUT_ACCELERATORS = {
  'ctrl-shift-space': 'CommandOrControl+Shift+Space',
  'ctrl-alt-space': 'CommandOrControl+Alt+Space',
  'ctrl-shift-g': 'CommandOrControl+Shift+G',
};

const registerGhostShortcut = shortcut => {
  const accelerator = GHOST_SHORTCUT_ACCELERATORS[shortcut];
  if (!accelerator) throw new Error('Choose one of the supported Ghost AI shortcuts.');
  if (accelerator === activeGhostShortcut) return true;
  if (!globalShortcut.register(accelerator, () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.show();
    mainWindow.focus();
    if (mainWindow.webContents.isLoading()) {
      pendingGhostToggle = true;
      return;
    }
    mainWindow.webContents.send('ghost-ai:toggle');
  })) {
    return false;
  }
  if (activeGhostShortcut) globalShortcut.unregister(activeGhostShortcut);
  activeGhostShortcut = accelerator;
  return true;
};

ipcMain.handle('ghost-ai:setGlobalShortcut', (event, shortcut) => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Ghost AI shortcuts can only be changed from ARLO OS settings.');
  }
  if (typeof shortcut !== 'string' || !Object.hasOwn(GHOST_SHORTCUT_ACCELERATORS, shortcut)) {
    throw new Error('That Ghost AI shortcut is not supported.');
  }
  return registerGhostShortcut(shortcut);
});

ipcMain.handle('ghost-ai:wakeDetected', event => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Ghost AI wake detection is only available to ARLO OS.');
  }
  mainWindow.show();
  mainWindow.focus();
});

const sendGhostWakeState = state => {
  ghostWakeStatus = state.status;
  ghostWakeStateWaiters.forEach(waiter => {
    if (waiter.status === state.status) waiter.resolve();
    else if (state.status === 'error' || state.status === 'stopped') {
      waiter.reject(new Error(state.message || `The local speech recognizer is ${state.status}.`));
    }
  });
  if (!mainWindow?.isDestroyed()) mainWindow?.webContents.send('ghost-ai:wakeState', state);
};

const waitForGhostWakeState = status => {
  if (ghostWakeStatus === status) return Promise.resolve();
  if (ghostWakeStatus === 'error' || ghostWakeStatus === 'stopped') {
    return Promise.reject(new Error(`The local speech recognizer is ${ghostWakeStatus}.`));
  }
  return new Promise((resolve, reject) => {
    const waiter = {
      status,
      resolve: () => {
        clearTimeout(timeout);
        ghostWakeStateWaiters.delete(waiter);
        resolve();
      },
      reject: error => {
        clearTimeout(timeout);
        ghostWakeStateWaiters.delete(waiter);
        reject(error);
      },
    };
    const timeout = setTimeout(() => {
      ghostWakeStateWaiters.delete(waiter);
      reject(new Error(`Timed out waiting for the local speech recognizer to ${status}.`));
    }, 10_000);
    ghostWakeStateWaiters.add(waiter);
  });
};

ipcMain.handle('ghost-ai:startWakeListener', async event => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Ghost AI voice activation is only available to ARLO OS.');
  }
  if (process.platform !== 'win32') {
    throw new Error('Local Hey Ghost voice activation is currently available on Windows only.');
  }
  if (ghostWakeProcess && ghostWakeProcess.exitCode === null && ghostWakeStopping) {
    await new Promise(resolve => ghostWakeProcess.once('exit', resolve));
  }
  if (ghostWakeProcess && ghostWakeProcess.exitCode === null) return true;

  const executable = ghostVoiceExecutable();
  try {
    await fs.access(executable);
  } catch (error) {
    throw new Error(
      'The bundled offline voice listener is missing. Rebuild the app with "npm run build:voice".',
      { cause: error },
    );
  }
  const speechProcess = spawn(executable, [], {
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  ghostWakeProcess = speechProcess;
  ghostWakeStopping = false;
  sendGhostWakeState({ status: 'starting' });

  let outputBuffer = '';
  speechProcess.stdout.setEncoding('utf8');
  speechProcess.stdout.on('data', chunk => {
    outputBuffer += chunk;
    const lines = outputBuffer.split(/\r?\n/);
    outputBuffer = lines.pop() ?? '';
    lines.forEach(line => {
      if (!line.trim()) return;
      try {
        const message = JSON.parse(line);
        if (message.type === 'transcript' && typeof message.text === 'string') {
          mainWindow?.webContents.send('ghost-ai:transcript', {
            text: message.text,
            language: typeof message.language === 'string' ? message.language : 'en',
          });
        } else if (message.type === 'ready' || message.type === 'paused') {
          sendGhostWakeState({ status: message.type });
        } else if (message.type === 'error') {
          console.error('[Ghost AI] Local speech recognition failed:', message.message);
          sendGhostWakeState({ status: 'error', message: message.message });
        }
      } catch (error) {
        console.error('[Ghost AI] Could not parse local speech recognizer output:', error);
      }
    });
  });
  speechProcess.stderr.setEncoding('utf8');
  let stderrBuffer = '';
  speechProcess.stderr.on('data', chunk => {
    stderrBuffer += chunk;
    const lines = stderrBuffer.split(/\r?\n/);
    stderrBuffer = lines.pop() ?? '';
    lines.forEach(line => {
      const detail = line.trim();
      if (
        !detail ||
        /microphone input warning: input overflow/i.test(detail) ||
        /^#<\s*CLIXML$/i.test(detail) ||
        /^<Objs\b|<\/Objs>/i.test(detail) ||
        /Preparing modules for first use\./i.test(detail)
      ) return;
      console.warn('[Ghost AI] Local speech recognizer:', detail);
    });
  });
  let controlPipeFailed = false;
  const handleControlPipeError = error => {
    if (controlPipeFailed) return;
    controlPipeFailed = true;
    if (error.code === 'EPIPE') {
      console.warn('[Ghost AI] Local speech recognizer control pipe closed.');
    } else {
      console.error('[Ghost AI] Local speech recognizer control pipe failed:', error);
    }
    if (ghostWakeProcess === speechProcess) {
      ghostWakeStopping = false;
      sendGhostWakeState({
        status: 'error',
        message: 'The local speech recognizer stopped. Restart ARLO OS to enable wake-word listening again.',
      });
    }
  };
  speechProcess.stdin.on('error', handleControlPipeError);
  speechProcess.on('error', error => {
    console.error('[Ghost AI] Could not launch the local Windows speech recognizer:', error);
    if (ghostWakeProcess === speechProcess) {
      ghostWakeProcess = null;
      ghostWakeStopping = false;
    }
    sendGhostWakeState({ status: 'error', message: error.message });
  });
  speechProcess.on('exit', (code, signal) => {
    const wasStopping = ghostWakeStopping;
    if (ghostWakeProcess === speechProcess) {
      ghostWakeProcess = null;
      ghostWakeStopping = false;
    }
    if (code !== 0 && code !== null) {
      sendGhostWakeState({ status: 'error', message: `The local speech recognizer exited with code ${code}.` });
    } else if (code === 0 && !wasStopping) {
      sendGhostWakeState({ status: 'error', message: 'The local speech recognizer stopped unexpectedly.' });
    } else if (wasStopping || signal) {
      sendGhostWakeState({ status: 'stopped' });
    }
  });
  return true;
});

ipcMain.handle('ghost-ai:stopWakeListener', event => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Ghost AI voice activation is only available to ARLO OS.');
  }
  if (ghostWakeProcess && ghostWakeProcess.exitCode === null) {
    ghostWakeStopping = true;
    try {
      if (!ghostWakeProcess.stdin.destroyed && !ghostWakeProcess.stdin.writableEnded) {
        ghostWakeProcess.stdin.write('stop\n');
      }
    } catch (error) {
      if (error.code !== 'EPIPE') {
        console.error('[Ghost AI] Could not stop the local speech recognizer:', error);
      }
    }
  }
  sendGhostWakeState({ status: 'stopped' });
});

ipcMain.handle('ghost-ai:setWakePaused', (event, paused) => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Ghost AI voice activation is only available to ARLO OS.');
  }
  if (typeof paused !== 'boolean') throw new Error('Invalid Ghost AI listener state.');
  if (ghostWakeProcess && ghostWakeProcess.exitCode === null) {
    const expectedState = paused ? 'paused' : 'ready';
    if (ghostWakeStatus === expectedState) return;
    const stateChanged = waitForGhostWakeState(expectedState);
    try {
      if (ghostWakeProcess.stdin.destroyed || ghostWakeProcess.stdin.writableEnded) {
        sendGhostWakeState({ status: 'error', message: 'The local speech recognizer is no longer accepting commands.' });
        return stateChanged;
      }
      ghostWakeProcess.stdin.write(`${paused ? 'pause' : 'resume'}\n`);
    } catch (error) {
      if (error.code !== 'EPIPE') {
        console.error('[Ghost AI] Could not update local speech recognizer state:', error);
      }
      sendGhostWakeState({ status: 'error', message: 'The local speech recognizer stopped responding.' });
    }
    return stateChanged;
  }
});

const isTrustedCodeRunnerFrame = frame => {
  if (!frame || frame !== mainWindow?.webContents.mainFrame) return false;

  if (isDev) {
    try {
      const url = new URL(frame.url);
      const expectedPort = process.env.ELECTRON_VITE_PORT || '5173';
      return (
        url.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(url.hostname) &&
        url.port === expectedPort
      );
    } catch {
      return false;
    }
  }

  if (!frame.url.startsWith('file:')) return false;
  try {
    return path.resolve(fileURLToPath(frame.url)) ===
      path.resolve(__dirname, 'dist', 'index.html');
  } catch {
    return false;
  }
};

ipcMain.handle('code:run', (event, request) => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Code execution is only available to the ARLO OS desktop window.');
  }
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new Error('Invalid code execution request.');
  }
  return runCode(request);
});

ipcMain.handle('code:installRuntime', (event, language) => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Runtime installation is only available to the ARLO OS desktop window.');
  }
  return installCodeRuntime(language);
});

ipcMain.handle('ghost-ai:isConfigured', event => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Ghost AI is only available to the ARLO OS desktop window.');
  }
  return getGeminiApiKey().then(apiKey => Boolean(apiKey));
});

const getGeminiApiKey = async () => {
  const environmentKey = resolveGeminiApiKey(process.env.GEMINI_API_KEY, dotenvGeminiApiKey);
  if (environmentKey) return environmentKey;

  let encryptedKey;
  try {
    encryptedKey = await fs.readFile(geminiApiKeyFile());
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw new Error('Could not read the saved Gemini API key from this Windows account.', { cause: error });
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Windows secure storage is unavailable. Restart Windows and try again.');
  }
  try {
    return safeStorage.decryptString(encryptedKey).trim();
  } catch (error) {
    throw new Error('The saved Gemini API key could not be decrypted. Remove it and save the key again.', { cause: error });
  }
};

ipcMain.handle('ghost-ai:setApiKey', async (event, apiKey) => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Ghost AI settings are only available to the ARLO OS desktop window.');
  }
  if (typeof apiKey !== 'string' || !apiKey.trim() || apiKey.trim().length > 512) {
    throw new Error('Enter a valid Gemini API key (1–512 characters).');
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Windows secure credential storage is unavailable. The API key was not saved.');
  }

  await fs.writeFile(geminiApiKeyFile(), safeStorage.encryptString(apiKey.trim()));
  return true;
});

ipcMain.handle('ghost-ai:synthesizeSpeech', async (event, text) => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Lily speech is only available to the ARLO OS desktop window.');
  }
  if (typeof text !== 'string' || !text.trim() || text.length > 5000) {
    throw new Error('Lily can speak text up to 5,000 characters.');
  }

  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Check GEMINI_API_KEY in the app .env file or configure it in Ghost AI.');
  }

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'gemini-3.8-flash-tts',
      input: [{
        type: 'user_input',
        content: [{
          type: 'text',
          text: text.trim(),
          annotations: [{
            type: 'speech_metadata',
            style: 'Speak in a natural, warm, calm, friendly female voice. Use clear conversational pacing and pronounce the text in its original language.',
          }],
        }],
      }],
      response_format: { type: 'audio' },
      generation_config: { speech_config: [{ voice: 'Kore' }] },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error('Gemini returned an unreadable voice response.', { cause: error });
  }
  if (!response.ok) {
    const detail = typeof payload?.error?.message === 'string'
      ? payload.error.message.replaceAll(apiKey, '[REDACTED]').slice(0, 300)
      : `HTTP ${response.status}`;
    throw new Error(`Lily's online voice request failed: ${detail}`);
  }

  const audioData = payload?.output_audio?.data ??
    (Array.isArray(payload?.steps)
      ? payload.steps.flatMap(step => Array.isArray(step?.content) ? step.content : [])
        .filter(content => content?.type === 'audio')
        .at(-1)?.data
      : undefined);
  if (
    typeof audioData !== 'string' ||
    audioData.length > 20_000_000 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(audioData)
  ) {
    throw new Error('Gemini did not return valid audio for Lily.');
  }
  return audioData;
});

ipcMain.handle('ghost-ai:removeApiKey', async event => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Ghost AI settings are only available to the ARLO OS desktop window.');
  }
  try {
    await fs.unlink(geminiApiKeyFile());
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw new Error('Could not remove the saved Gemini API key.', { cause: error });
    }
  }
  return true;
});

ipcMain.handle('ghost-ai:chat', async (event, request) => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    return {
      success: false,
      code: 'UNTRUSTED_CALLER',
      message: 'Ghost AI is only available to the ARLO OS desktop window.',
    };
  }

  if (
    !request ||
    typeof request !== 'object' ||
    Array.isArray(request) ||
    (request.model !== undefined && request.model !== GHOST_GEMINI_MODEL) ||
    typeof request.requestId !== 'string' ||
    !/^[\w-]{1,100}$/.test(request.requestId) ||
    !Array.isArray(request.messages) ||
    request.messages.length < 1 ||
    request.messages.length > 40 ||
    !request.context ||
    typeof request.context.displayName !== 'string' ||
    !request.context.displayName.trim() ||
    request.context.displayName.length > 100 ||
    !Array.isArray(request.context.availableApps) ||
    request.context.availableApps.length > 100 ||
    !request.context.detective ||
    typeof request.context.detective.name !== 'string' ||
    typeof request.context.detective.role !== 'string' ||
    typeof request.context.detective.personality !== 'string' ||
    typeof request.context.detective.description !== 'string' ||
    typeof request.context.detective.instructions !== 'string' ||
    request.context.detective.instructions.length > 2000 ||
    !Array.isArray(request.context.detective.skills) ||
    request.context.detective.skills.length > 20 ||
    request.context.detective.skills.some(value => typeof value !== 'string' || value.length > 80) ||
    !Array.isArray(request.context.detective.permittedTools) ||
    request.context.detective.permittedTools.length > 30 ||
    request.context.detective.permittedTools.some(value =>
      typeof value !== 'string' ||
      value.length > 80 ||
      !GHOST_REGISTERED_CAPABILITY_NAMES.has(value),
    ) ||
    ['name', 'role', 'personality', 'description'].some(field => request.context.detective[field].length > 300)
  ) {
    return { success: false, code: 'INVALID_REQUEST', message: 'Ghost received an invalid chat request.' };
  }

  const messages = [];
  for (const message of request.messages) {
    if (
      !message ||
      typeof message !== 'object' ||
      !['user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string' ||
      !message.content.trim() ||
      message.content.length > 20_000
    ) {
      return { success: false, code: 'INVALID_REQUEST', message: 'Ghost received an invalid chat message.' };
    }
    messages.push({ role: message.role, content: message.content });
  }
  const totalCharacters = messages.reduce((sum, message) => sum + message.content.length, 0);
  if (totalCharacters > 100_000) {
    return { success: false, code: 'CONVERSATION_TOO_LONG', message: 'This conversation is too long. Start a new chat and try again.' };
  }

  const context = {
    displayName: request.context.displayName.trim(),
    availableApps: request.context.availableApps.filter(app =>
      app &&
      typeof app.id === 'string' &&
      typeof app.name === 'string' &&
      app.id.length <= 80 &&
      app.name.length <= 120,
    ),
    detective: {
      ...request.context.detective,
      name: request.context.detective.name.trim(),
      role: request.context.detective.role.trim(),
      personality: request.context.detective.personality.trim(),
      description: request.context.detective.description.trim(),
      instructions: request.context.detective.instructions.slice(0, 2000),
      skills: request.context.detective.skills.slice(0, 20),
      permittedTools: request.context.detective.permittedTools.slice(0, 30),
    },
  };
  if (context.availableApps.length !== request.context.availableApps.length) {
    return { success: false, code: 'INVALID_REQUEST', message: 'Ghost received invalid app context.' };
  }

  let pendingToolCalls;
  let toolResults;
  if (request.pendingToolCalls !== undefined || request.toolResults !== undefined) {
    if (
      !isValidGhostToolResults(request.pendingToolCalls, request.toolResults) ||
      request.pendingToolCalls.some(call =>
        !GHOST_REGISTERED_CAPABILITY_NAMES.has(call.name) || !context.detective.permittedTools.includes(call.name),
      )
    ) {
      return { success: false, code: 'INVALID_TOOL_RESULTS', message: 'Ghost received invalid tool results.' };
    }
    pendingToolCalls = request.pendingToolCalls;
    toolResults = request.toolResults;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('Ghost AI request timed out.')), 30_000);
  ghostChatControllers.set(request.requestId, controller);
  let apiKey = '';
  try {
    apiKey = await getGeminiApiKey();
    if (!apiKey) {
      return {
        success: false,
        code: 'MISSING_API_KEY',
        message: 'Ghost AI needs a Gemini API key.',
      };
    }
    const { GoogleGenAI } = await import('@google/genai');
    const genAI = new GoogleGenAI({ apiKey });
    const response = await runGhostAgent(genAI, {
      model: GHOST_GEMINI_MODEL,
      messages,
      context,
      ...(pendingToolCalls ? { pendingToolCalls, toolResults } : {}),
    }, controller.signal);
    return response.kind === 'message'
      ? { success: true, kind: 'message', message: response.message }
      : { success: true, kind: 'tool_calls', toolCalls: response.toolCalls };
  } catch (error) {
    const timedOut = controller.signal.reason?.message === 'Ghost AI request timed out.';
    const cancelled = controller.signal.reason?.message === 'Ghost AI request cancelled.';
    const rawDetail = error instanceof Error ? error.message : String(error);
    const detail = apiKey ? rawDetail.replaceAll(apiKey, '[REDACTED]') : rawDetail;
    console.error('[Ghost AI] Gemini request failed:', detail.slice(0, 500));
    return {
      success: false,
      code: timedOut ? 'REQUEST_TIMEOUT' : cancelled ? 'CANCELLED' : 'AI_SERVICE_ERROR',
      message: timedOut
        ? 'Ghost AI timed out. Please try again.'
        : cancelled
          ? 'Ghost AI request was cancelled.'
          : "Ghost couldn't connect to its AI service.",
      details: detail.slice(0, 500),
    };
  } finally {
    clearTimeout(timeout);
    if (ghostChatControllers.get(request.requestId) === controller) {
      ghostChatControllers.delete(request.requestId);
    }
  }
});

ipcMain.handle('ghost-ai:cancelChat', (event, requestId) => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    return false;
  }
  const controller = ghostChatControllers.get(requestId);
  if (!controller) return false;
  controller.abort(new Error('Ghost AI request cancelled.'));
  return true;
});

ipcMain.handle('window:capturePreview', async (event, bounds) => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Window previews are only available to the ARLO OS desktop window.');
  }
  if (
    !bounds ||
    !['x', 'y', 'width', 'height'].every(key =>
      Number.isFinite(bounds[key])
    ) ||
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    throw new Error('Invalid window preview bounds.');
  }

  const contentBounds = mainWindow.getContentBounds();
  const x = Math.max(0, Math.floor(bounds.x));
  const y = Math.max(0, Math.floor(bounds.y));
  const right = Math.min(contentBounds.width, Math.ceil(bounds.x + bounds.width));
  const bottom = Math.min(contentBounds.height, Math.ceil(bounds.y + bounds.height));
  if (right <= x || bottom <= y) {
    throw new Error('The window is outside the visible desktop area.');
  }

  const image = await mainWindow.webContents.capturePage({
    x,
    y,
    width: right - x,
    height: bottom - y,
  });
  if (image.isEmpty()) {
    throw new Error('Electron returned an empty window preview.');
  }
  return image.resize({ width: 560 }).toDataURL();
});

ipcMain.handle('studio:clipboardRead', event => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Clipboard access is only available to the ARLO OS desktop window.');
  }
  return clipboard.readText();
});

ipcMain.handle('studio:clipboardWrite', (event, text) => {
  if (
    event.sender !== mainWindow?.webContents ||
    !isTrustedCodeRunnerFrame(event.senderFrame)
  ) {
    throw new Error('Clipboard access is only available to the ARLO OS desktop window.');
  }
  if (typeof text !== 'string') {
    throw new Error('Clipboard contents must be text.');
  }
  clipboard.writeText(text);
});

ipcMain.handle('files:chooseFolders', event => {
  assertTrustedFilesFrame(event);
  return chooseLocalFolders();
});
ipcMain.handle('files:chooseApplication', event => {
  assertTrustedFilesFrame(event);
  return chooseLocalApplication();
});
ipcMain.handle('files:getFolders', event => {
  assertTrustedFilesFrame(event);
  return getAuthorizedFolders();
});
ipcMain.handle('files:grantAllDrives', event => {
  assertTrustedFilesFrame(event);
  return grantFullFilesystemAccess();
});
ipcMain.handle('files:revokeAllDrives', event => {
  assertTrustedFilesFrame(event);
  return revokeFullFilesystemAccess();
});
ipcMain.handle('files:removeFolder', (event, folderPath) => {
  assertTrustedFilesFrame(event);
  return removeLocalFolder(folderPath);
});
ipcMain.handle('files:listFolder', (event, folderPath) => {
  assertTrustedFilesFrame(event);
  return listLocalFolder(folderPath);
});
ipcMain.handle('files:searchAuthorizedFiles', (event, terms) => {
  assertTrustedFilesFrame(event);
  return searchAuthorizedFiles(terms);
});
ipcMain.handle('files:openPath', (event, targetPath) => {
  assertTrustedFilesFrame(event);
  return openAuthorizedLocalPath(targetPath);
});
ipcMain.handle('files:openCodeFile', (event, targetPath) => {
  assertTrustedFilesFrame(event);
  return openAuthorizedCodeFile(targetPath);
});
ipcMain.handle('files:openCodePath', (event, targetPath) => {
  assertTrustedFilesFrame(event);
  return openAuthorizedCodePath(targetPath);
});
ipcMain.handle('files:readImage', (event, targetPath) => {
  assertTrustedFilesFrame(event);
  return readAuthorizedImage(targetPath);
});
ipcMain.handle('files:getMediaUrl', async (event, targetPath) => {
  assertTrustedFilesFrame(event);
  if (!(await isLocalPathAuthorized(targetPath))) {
    throw new Error('This media file is outside the folders granted to ARLO OS.');
  }
  return `abhishek-local://media/?path=${encodeURIComponent(await fs.realpath(targetPath))}`;
});
ipcMain.handle('files:createEntry', (event, parentPath, name, isDirectory) => {
  assertTrustedFilesFrame(event);
  if (typeof isDirectory !== 'boolean') throw new Error('Invalid entry type.');
  return createAuthorizedLocalEntry(parentPath, name, isDirectory);
});
ipcMain.handle('files:renameEntry', (event, targetPath, newName) => {
  assertTrustedFilesFrame(event);
  return renameAuthorizedLocalEntry(targetPath, newName);
});
ipcMain.handle('files:trashEntry', (event, targetPath) => {
  assertTrustedFilesFrame(event);
  return runSerializedTrashOperation(() => trashAuthorizedLocalEntry(targetPath));
});
ipcMain.handle('files:listTrash', event => {
  assertTrustedFilesFrame(event);
  return runSerializedTrashOperation(() => listLocalTrash());
});
ipcMain.handle('files:restoreTrashEntry', (event, id) => {
  assertTrustedFilesFrame(event);
  return runSerializedTrashOperation(() => restoreLocalTrashEntry(id));
});
ipcMain.handle('files:deleteTrashEntry', (event, id) => {
  assertTrustedFilesFrame(event);
  return runSerializedTrashOperation(() => deleteLocalTrashEntry(id));
});
ipcMain.handle('files:emptyTrash', event => {
  assertTrustedFilesFrame(event);
  return runSerializedTrashOperation(() => emptyLocalTrash());
});
ipcMain.handle('system:getResourceUsage', async event => {
  assertTrustedFilesFrame(event);
  let currentCpuTimes = readCpuTimes();
  if (!previousCpuTimes) {
    await new Promise(resolve => setTimeout(resolve, 250));
    currentCpuTimes = readCpuTimes();
  }
  let cpuPercent = null;
  if (previousCpuTimes) {
    const totalDelta = Object.keys(currentCpuTimes).reduce(
      (sum, key) => sum + currentCpuTimes[key] - previousCpuTimes[key],
      0,
    );
    const idleDelta = currentCpuTimes.idle - previousCpuTimes.idle;
    if (totalDelta > 0 && idleDelta >= 0) {
      cpuPercent = Math.max(0, Math.min(100, Math.round((1 - idleDelta / totalDelta) * 100)));
    }
  }
  previousCpuTimes = currentCpuTimes;

  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  return {
    cpuPercent,
    memoryUsedBytes: totalMemory > 0 ? totalMemory - freeMemory : null,
    memoryTotalBytes: totalMemory > 0 ? totalMemory : null,
  };
});
ipcMain.handle('system:getBatteryStatus', async event => {
  assertTrustedFilesFrame(event);
  if (process.platform !== 'win32') {
    return { available: false, level: 0, charging: false, plugged: false };
  }

  const script = `Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class AbhishekPowerStatus {
  [StructLayout(LayoutKind.Sequential)]
  public struct Status {
    public byte ACLineStatus;
    public byte BatteryFlag;
    public byte BatteryLifePercent;
    public byte SystemStatusFlag;
    public uint BatteryLifeTime;
    public uint BatteryFullLifeTime;
  }
  [DllImport("kernel32.dll")]
  public static extern bool GetSystemPowerStatus(out Status status);
}
'@;
$status = New-Object AbhishekPowerStatus+Status;
if (-not [AbhishekPowerStatus]::GetSystemPowerStatus([ref]$status)) { throw 'Windows did not return its power status.' }
[pscustomobject]@{
  available = ($status.BatteryLifePercent -ne 255 -and $status.BatteryFlag -ne 128 -and $status.BatteryFlag -ne 255)
  level = [int]$status.BatteryLifePercent
  charging = (($status.BatteryFlag -band 8) -ne 0)
  plugged = ($status.ACLineStatus -eq 1)
} | ConvertTo-Json -Compress`;

  try {
    const { stdout } = await execFileAsync('powershell.exe', [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      script,
    ], { timeout: 10000, windowsHide: true, maxBuffer: 1024 * 1024 });
    const status = JSON.parse(stdout.trim());
    if (
      typeof status.available !== 'boolean' ||
      !Number.isInteger(status.level) ||
      typeof status.charging !== 'boolean' ||
      typeof status.plugged !== 'boolean'
    ) {
      throw new Error('Windows returned malformed battery status.');
    }
    return {
      available: status.available,
      level: Math.max(0, Math.min(100, status.level)),
      charging: status.charging,
      plugged: status.plugged,
    };
  } catch (error) {
    console.warn('[System] Could not read Windows battery status:', error);
    return { available: false, level: 0, charging: false, plugged: false };
  }
});
ipcMain.handle('files:transferEntries', (event, sourcePaths, destinationPath, move) => {
  assertTrustedFilesFrame(event);
  if (typeof move !== 'boolean') throw new Error('Invalid transfer mode.');
  return transferAuthorizedLocalEntries(sourcePaths, destinationPath, move);
});
ipcMain.handle('files:openTerminal', (event, targetPath) => {
  assertTrustedFilesFrame(event);
  return openAuthorizedTerminal(targetPath);
});

async function readLocalFolders() {
  try {
    const saved = JSON.parse(await fs.readFile(localFoldersFile(), 'utf8'));
    return Array.isArray(saved) ? saved.filter(item => item && typeof item.path === 'string') : [];
  } catch {
    return [];
  }
}

async function hasFullFilesystemAccess() {
  try {
    const grant = JSON.parse(await fs.readFile(fullAccessFile(), 'utf8'));
    return grant?.granted === true;
  } catch {
    return false;
  }
}

async function getDriveRoots() {
  if (process.platform !== 'win32') {
    return [];
  }

  const drives = await Promise.all(Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', async letter => {
    const drivePath = `${letter}:${path.sep}`;
    try {
      const stats = await fs.stat(drivePath);
      return stats.isDirectory()
        ? { path: drivePath, label: `Drive (${letter}:)`, isDriveRoot: true }
        : null;
    } catch {
      return null;
    }
  }));

  return drives.filter(Boolean);
}

async function getAuthorizedFolders() {
  if (await hasFullFilesystemAccess()) {
    return getDriveRoots();
  }
  return readLocalFolders();
}

async function grantFullFilesystemAccess() {
  if (process.platform !== 'win32') {
    throw new Error('All-drive access is currently supported on Windows only.');
  }

  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(fullAccessFile(), JSON.stringify({ granted: true, grantedAt: new Date().toISOString() }), 'utf8');
  return getAuthorizedFolders();
}

async function revokeFullFilesystemAccess() {
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(fullAccessFile(), JSON.stringify({ granted: false }), 'utf8');
  return readLocalFolders();
}

async function isLocalPathAuthorized(candidate) {
  if (typeof candidate !== 'string' || !path.isAbsolute(candidate)) {
    return false;
  }

  let candidateRealPath;
  try {
    candidateRealPath = await fs.realpath(candidate);
  } catch {
    return false;
  }

  if (await hasFullFilesystemAccess()) {
    const roots = await getDriveRoots();
    for (const root of roots) {
      try {
        const rootRealPath = await fs.realpath(root.path);
        const relative = path.relative(rootRealPath, candidateRealPath);
        if (relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) {
          return true;
        }
      } catch {
        continue;
      }
    }
    return false;
  }

  const folders = await readLocalFolders();
  for (const folder of folders) {
    try {
      const rootRealPath = await fs.realpath(folder.path);
      const relative = path.relative(rootRealPath, candidateRealPath);
      if (relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) {
        return true;
      }
    } catch {
      continue;
    }
  }
  return false;
}

async function chooseLocalFolders() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose folders for ARLO OS Finder',
    properties: ['openDirectory', 'multiSelections'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true, folders: await readLocalFolders() };
  }

  const selectedFolders = result.filePaths.map(folderPath => ({
    path: path.resolve(folderPath),
    label: path.basename(folderPath) || folderPath,
  }));
  const existingFolders = await readLocalFolders();
  const folders = [...new Map([...existingFolders, ...selectedFolders].map(folder => [
    process.platform === 'win32' ? folder.path.toLowerCase() : folder.path,
    folder,
  ])).values()];
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(localFoldersFile(), JSON.stringify(folders, null, 2), 'utf8');
  return { canceled: false, folders };
}

async function chooseLocalApplication() {
  if (process.platform !== 'win32') {
    throw new Error('Adding local applications is currently supported on Windows only.');
  }
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose an application inside a connected Finder folder',
    properties: ['openFile'],
    filters: [{ name: 'Windows applications', extensions: ['exe', 'lnk'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };

  const applicationPath = await fs.realpath(result.filePaths[0]);
  if (!(await isLocalPathAuthorized(applicationPath))) {
    throw new Error('Connect the folder containing this application in Finder before adding it.');
  }
  const stats = await fs.stat(applicationPath);
  if (!stats.isFile() || !['.exe', '.lnk'].includes(path.extname(applicationPath).toLowerCase())) {
    throw new Error('Choose a Windows application (.exe) or shortcut (.lnk).');
  }

  let iconUrl;
  try {
    iconUrl = (await app.getFileIcon(applicationPath, { size: 'large' })).toDataURL();
  } catch (error) {
    console.warn('[Finder] Could not load the selected application icon:', error);
  }
  return {
    canceled: false,
    application: {
      name: path.basename(applicationPath, path.extname(applicationPath)),
      path: applicationPath,
      iconUrl,
    },
  };
}

async function removeLocalFolder(folderPath) {
  const folders = await readLocalFolders();
  const normalizedPath = path.resolve(folderPath);
  const filtered = folders.filter(folder => process.platform === 'win32'
    ? folder.path.toLowerCase() !== normalizedPath.toLowerCase()
    : folder.path !== normalizedPath);
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(localFoldersFile(), JSON.stringify(filtered, null, 2), 'utf8');
  return filtered;
}

async function listLocalFolder(folderPath) {
  if (folderPath === 'local://drives' && await hasFullFilesystemAccess()) {
    const now = new Date().toISOString();
    return (await getDriveRoots()).map(drive => ({
      name: drive.label,
      hostPath: drive.path,
      isDirectory: true,
      size: 0,
      extension: '',
      createdAt: now,
      updatedAt: now,
    }));
  }

  if (!(await isLocalPathAuthorized(folderPath))) {
    throw new Error('This folder has not been granted to ARLO OS.');
  }

  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const results = await Promise.all(entries
    .filter(entry => !entry.isSymbolicLink())
    .map(async entry => {
      const entryPath = path.join(folderPath, entry.name);
      try {
        const stats = await fs.stat(entryPath);
        return {
          name: entry.name,
          hostPath: entryPath,
          isDirectory: entry.isDirectory(),
          size: entry.isDirectory() ? 0 : stats.size,
          extension: path.extname(entry.name).slice(1).toLowerCase(),
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString(),
        };
      } catch {
        return null;
      }
    }));

  return results.filter(Boolean).sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
}

async function searchAuthorizedFiles(terms) {
  if (
    !Array.isArray(terms) ||
    terms.length < 1 ||
    terms.length > 100 ||
    !terms.every(term => typeof term === 'string' && /^[\p{L}\p{N}_-]{2,40}$/u.test(term))
  ) {
    throw new Error('The local search request is invalid.');
  }

  const searchableExtensions = new Set([
    'c', 'cc', 'cpp', 'css', 'csv', 'go', 'h', 'hpp', 'html', 'java', 'js',
    'jsx', 'json', 'md', 'py', 'rs', 'scss', 'sh', 'sql', 'ts', 'tsx', 'txt',
    'xml', 'yaml', 'yml',
  ]);
  const ignoredDirectoryNames = new Set([
    '$recycle.bin', '.git', 'appdata', 'node_modules', 'program files',
    'program files (x86)', 'system volume information', 'windows',
  ]);
  const queue = (await getAuthorizedFolders()).map(folder => folder.path);
  const found = [];
  let visitedFiles = 0;
  let readBytes = 0;

  while (queue.length && visitedFiles < 1_200 && readBytes < 32 * 1024 * 1024) {
    const folderPath = queue.shift();
    if (!folderPath || !(await isLocalPathAuthorized(folderPath))) continue;
    let entries;
    try {
      entries = await fs.readdir(folderPath, { withFileTypes: true });
    } catch (error) {
      console.warn('[Local Search] Could not inspect an authorized folder:', error);
      continue;
    }

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const targetPath = path.join(folderPath, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectoryNames.has(entry.name.toLocaleLowerCase()) && queue.length < 300) {
          queue.push(targetPath);
        }
        continue;
      }
      if (!entry.isFile()) continue;

      const extension = path.extname(entry.name).slice(1).toLocaleLowerCase();
      if (!searchableExtensions.has(extension)) continue;
      visitedFiles += 1;
      try {
        const stats = await fs.stat(targetPath);
        if (stats.size > 512 * 1024 || readBytes + stats.size > 32 * 1024 * 1024) continue;
        const content = await fs.readFile(targetPath, 'utf8');
        readBytes += stats.size;
        const lowerContent = content.toLocaleLowerCase();
        const matchedTerms = terms.filter(term => lowerContent.includes(term.toLocaleLowerCase()));
        if (!matchedTerms.length) continue;
        const firstMatch = Math.min(...matchedTerms
          .map(term => lowerContent.indexOf(term.toLocaleLowerCase()))
          .filter(offset => offset >= 0));
        const start = Math.max(0, firstMatch - 80);
        const snippet = content.slice(start, start + 220).replace(/\s+/g, ' ').trim();
        found.push({
          name: entry.name,
          path: targetPath,
          extension,
          snippet: `${start ? '…' : ''}${snippet}${start + 220 < content.length ? '…' : ''}`,
          score: matchedTerms.length,
        });
      } catch (error) {
        console.warn(`[Local Search] Could not read "${targetPath}":`, error);
      }
      if (visitedFiles >= 1_200) break;
    }
  }

  return found.sort((left, right) => right.score - left.score || left.name.localeCompare(right.name)).slice(0, 20);
}

async function openAuthorizedLocalPath(targetPath) {
  if (!(await isLocalPathAuthorized(targetPath))) {
    throw new Error('This item is outside the folders granted to ARLO OS.');
  }
  const errorMessage = await shell.openPath(targetPath);
  if (errorMessage) throw new Error(errorMessage);
  return '';
}

const CODE_FILE_EXTENSIONS = new Set([
  'c', 'cc', 'cpp', 'css', 'go', 'h', 'hpp', 'html', 'java', 'js', 'jsx',
  'json', 'md', 'py', 'rs', 'scss', 'sh', 'sql', 'ts', 'tsx', 'txt', 'xml',
]);
const LOCAL_MEDIA_MIME_TYPES = {
  aac: 'audio/aac',
  avif: 'image/avif',
  bmp: 'image/bmp',
  flac: 'audio/flac',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  pdf: 'application/pdf',
  m4a: 'audio/mp4',
  m4v: 'video/mp4',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  oga: 'audio/ogg',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  png: 'image/png',
  svg: 'image/svg+xml',
  wav: 'audio/wav',
  webm: 'video/webm',
  webp: 'image/webp',
};

async function handleLocalMediaRequest(request) {
  try {
    const url = new URL(request.url);
    const targetPath = url.searchParams.get('path');
    if (!targetPath || !(await isLocalPathAuthorized(targetPath))) {
      return new Response('This media file is not authorized.', { status: 403 });
    }
    const realPath = await fs.realpath(targetPath);
    const mimeType = LOCAL_MEDIA_MIME_TYPES[path.extname(realPath).slice(1).toLowerCase()];
    if (!mimeType) {
      return new Response('Unsupported media type.', { status: 415 });
    }
    const stats = await fs.stat(realPath);
    if (!stats.isFile()) return new Response('Media item is not a file.', { status: 404 });
    const response = await net.fetch(pathToFileURL(realPath).toString());
    if (!response.ok) return response;
    const headers = new Headers(response.headers);
    headers.set('Content-Type', mimeType);
    headers.set('Cache-Control', 'no-store');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error('[Finder] Failed to stream local media:', error);
    return new Response('Unable to load this media file.', { status: 404 });
  }
}

async function findVSCodeExecutable() {
  if (process.platform === 'win32') {
    const candidates = [
      process.env.VSCODE_PATH,
      process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'Microsoft VS Code', 'Code.exe'),
      process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Microsoft VS Code', 'Code.exe'),
      process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Microsoft VS Code', 'Code.exe'),
      process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'Microsoft VS Code Insiders', 'Code - Insiders.exe'),
      process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Microsoft VS Code Insiders', 'Code - Insiders.exe'),
    ].filter(Boolean);

    for (const candidate of candidates) {
      const executable = candidate.toLowerCase().endsWith('.exe')
        ? candidate
        : path.join(candidate, 'Code.exe');
      try {
        await fs.access(executable);
        return executable;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    try {
      const { stdout } = await execFileAsync('where.exe', ['Code.exe']);
      const executable = stdout.split(/\r?\n/).map(value => value.trim()).find(Boolean);
      if (executable) return executable;
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 1) throw error;
    }
    return null;
  }

  const executable = process.platform === 'darwin' ? 'code' : 'code';
  try {
    const { stdout } = await execFileAsync('which', [executable]);
    return stdout.trim().split(/\r?\n/)[0] || null;
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 1) return null;
    throw error;
  }
}

const launchDetached = (executable, args) => new Promise((resolve, reject) => {
  const child = spawn(executable, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.once('error', reject);
  child.once('spawn', () => {
    child.removeAllListeners('error');
    child.unref();
    resolve();
  });
});

async function openAuthorizedCodeFile(targetPath) {
  if (!(await isLocalPathAuthorized(targetPath))) {
    throw new Error('This item is outside the folders granted to ARLO OS.');
  }
  const extension = path.extname(targetPath).slice(1).toLowerCase();
  if (!CODE_FILE_EXTENSIONS.has(extension)) {
    throw new Error('This file type is not supported by Code Studio.');
  }

  const executable = await findVSCodeExecutable();
  if (executable) {
    try {
      await launchDetached(executable, ['--reuse-window', targetPath]);
      return { opened: true };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  const stats = await fs.stat(targetPath);
  if (!stats.isFile() || stats.size > 5 * 1024 * 1024) {
    throw new Error('VS Code was not found and this file is too large to open in Code Studio (5 MB limit).');
  }
  return { opened: false, content: await fs.readFile(targetPath, 'utf8') };
}

async function openAuthorizedCodePath(targetPath) {
  if (!(await isLocalPathAuthorized(targetPath))) {
    throw new Error('This location is outside the folders granted to ARLO OS.');
  }
  const stats = await fs.stat(targetPath);
  if (stats.isFile()) return openAuthorizedCodeFile(targetPath);
  if (!stats.isDirectory()) throw new Error('This location cannot be opened in VS Code.');
  const executable = await findVSCodeExecutable();
  if (!executable) return { opened: false };
  await launchDetached(executable, ['--reuse-window', targetPath]);
  return { opened: true };
}

async function readAuthorizedImage(targetPath) {
  if (!(await isLocalPathAuthorized(targetPath))) {
    throw new Error('This image is outside the folders granted to ARLO OS.');
  }
  const mimeTypes = {
    avif: 'image/avif',
    bmp: 'image/bmp',
    gif: 'image/gif',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    webp: 'image/webp',
  };
  const extension = path.extname(targetPath).slice(1).toLowerCase();
  const mimeType = mimeTypes[extension];
  if (!mimeType) throw new Error('This image format cannot be previewed in Finder.');
  const stats = await fs.stat(targetPath);
  if (!stats.isFile() || stats.size > 2 * 1024 * 1024) {
    throw new Error('Image preview and wallpaper actions support files up to 2 MB.');
  }
  const image = await fs.readFile(targetPath);
  return `data:${mimeType};base64,${image.toString('base64')}`;
}

async function createAuthorizedLocalEntry(parentPath, name, isDirectory) {
  if (!(await isLocalPathAuthorized(parentPath))) {
    throw new Error('This folder has not been granted to ARLO OS.');
  }
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name !== path.basename(name) ||
    /[<>:"/\\|?*\x00-\x1f]/.test(name) ||
    name.endsWith('.')
  ) {
    throw new Error('Enter a valid file or folder name.');
  }
  const targetPath = path.join(parentPath, name);
  if (isDirectory) {
    await fs.mkdir(targetPath);
  } else {
    const handle = await fs.open(targetPath, 'wx');
    await handle.close();
  }
  return targetPath;
}

async function renameAuthorizedLocalEntry(sourcePath, newName) {
  if (!(await isLocalPathAuthorized(sourcePath))) {
    throw new Error('This item is outside the folders granted to ARLO OS.');
  }
  if (
    typeof newName !== 'string' ||
    !newName.trim() ||
    newName !== path.basename(newName) ||
    /[<>:"/\\|?*\x00-\x1f]/.test(newName) ||
    newName.endsWith('.')
  ) {
    throw new Error('Enter a valid file or folder name.');
  }
  const parentPath = path.dirname(sourcePath);
  if (!(await isLocalPathAuthorized(parentPath))) {
    throw new Error('The parent folder is outside the folders granted to ARLO OS.');
  }
  const destinationPath = path.join(parentPath, newName);
  try {
    await fs.lstat(destinationPath);
    throw new Error(`An item named "${newName}" already exists in this folder.`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.rename(sourcePath, destinationPath);
  return destinationPath;
}

async function trashAuthorizedLocalEntry(targetPath) {
  if (!(await isLocalPathAuthorized(targetPath))) {
    throw new Error('This item is outside the folders granted to ARLO OS.');
  }
  const sourcePath = await fs.realpath(targetPath);
  const stats = await fs.lstat(targetPath);
  if (sourcePath === path.parse(sourcePath).root) {
    throw new Error('A drive or filesystem root cannot be moved to Trash.');
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const trashPath = path.join(appTrashDirectory(), id);
  const entry = {
    id,
    name: path.basename(targetPath),
    type: getTrashEntryType(targetPath, stats.isDirectory()),
    extension: path.extname(targetPath).slice(1).toLowerCase(),
    size: stats.isFile() ? stats.size : 0,
    deletedAt: new Date().toISOString(),
    originalPath: targetPath,
    trashPath,
  };

  await ensureAppTrashDirectory();
  const entries = await readLocalTrashManifest();
  entries.push(entry);
  await writeLocalTrashManifest(entries);
  try {
    await fs.rename(targetPath, trashPath);
  } catch (error) {
    if (error.code === 'EXDEV') {
      try {
        await fs.cp(targetPath, trashPath, { recursive: true, errorOnExist: true, force: false, dereference: false });
      } catch (copyError) {
        await writeLocalTrashManifest(entries.filter(item => item.id !== id));
        throw copyError;
      }
      try {
        await fs.rm(targetPath, { recursive: true });
      } catch (removeError) {
        throw new Error(`The item was copied into app Trash, but the original could not be removed: ${removeError.message}`);
      }
    } else {
      await writeLocalTrashManifest(entries.filter(item => item.id !== id));
      throw error;
    }
  }
}

function runSerializedTrashOperation(operation) {
  const result = localTrashOperation.then(operation, operation);
  localTrashOperation = result.then(() => undefined, () => undefined);
  return result;
}

function getTrashEntryType(targetPath, isDirectory) {
  if (isDirectory) return 'folder';
  const extension = path.extname(targetPath).slice(1).toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(extension)) return 'image';
  if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'].includes(extension)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus'].includes(extension)) return 'audio';
  if (['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css', 'scss', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'sh', 'sql', 'md'].includes(extension)) return 'code';
  if (['zip', '7z', 'rar', 'tar', 'gz'].includes(extension)) return 'archive';
  return 'file';
}

async function readLocalTrashManifest() {
  try {
    const parsed = JSON.parse(await fs.readFile(appTrashManifest(), 'utf8'));
    return Array.isArray(parsed) ? parsed.filter(item =>
      item && typeof item.id === 'string' &&
      typeof item.originalPath === 'string' &&
      typeof item.trashPath === 'string'
    ) : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new Error(`Unable to read app Trash: ${error.message}`);
  }
}

async function writeLocalTrashManifest(entries) {
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  const filePath = appTrashManifest();
  const temporaryPath = `${filePath}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(entries, null, 2), 'utf8');
  await fs.rename(temporaryPath, filePath);
}

async function ensureAppTrashDirectory() {
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  try {
    await fs.mkdir(appTrashDirectory());
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  const rootStats = await fs.lstat(appTrashDirectory());
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    throw new Error('The app Trash folder is not a safe directory.');
  }
}

async function resolveAppTrashPath(entry) {
  await ensureAppTrashDirectory();
  const root = path.resolve(appTrashDirectory());
  const target = path.resolve(entry.trashPath);
  const relative = path.relative(root, target);
  if (
    !relative ||
    relative.startsWith(`..${path.sep}`) ||
    relative === '..' ||
    path.isAbsolute(relative) ||
    path.dirname(target) !== root ||
    path.basename(target) !== entry.id
  ) {
    throw new Error('Invalid item path in app Trash.');
  }
  return target;
}

async function listLocalTrash() {
  const entries = await readLocalTrashManifest();
  const available = [];
  for (const entry of entries) {
    try {
      const trashPath = await resolveAppTrashPath(entry);
      await fs.lstat(trashPath);
      available.push({
        id: entry.id,
        name: entry.name,
        type: entry.type,
        extension: entry.extension || '',
        size: entry.size,
        deletedAt: entry.deletedAt,
        originalLocation: path.dirname(entry.originalPath),
      });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (available.length !== entries.length) {
    const availableIds = new Set(available.map(item => item.id));
    await writeLocalTrashManifest(entries.filter(entry => availableIds.has(entry.id)));
  }
  return available;
}

async function restoreLocalTrashEntry(id) {
  const entries = await readLocalTrashManifest();
  const entry = entries.find(item => item.id === id);
  if (!entry) throw new Error('This item is no longer in app Trash.');
  const trashPath = await resolveAppTrashPath(entry);
  const originalPath = path.resolve(entry.originalPath);
  let destination = originalPath;
  try {
    await fs.lstat(destination);
    const extension = entry.type === 'folder' ? '' : path.extname(originalPath);
    const baseName = path.basename(originalPath, extension);
    destination = path.join(path.dirname(originalPath), `${baseName} (restored)${extension}`);
    let suffix = 2;
    while (true) {
      try {
        await fs.lstat(destination);
        destination = path.join(path.dirname(originalPath), `${baseName} (restored ${suffix++})${extension}`);
      } catch (error) {
        if (error.code === 'ENOENT') break;
        throw error;
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.rename(trashPath, destination);
  await writeLocalTrashManifest(entries.filter(item => item.id !== id));
  return destination;
}

async function deleteLocalTrashEntry(id) {
  const entries = await readLocalTrashManifest();
  const entry = entries.find(item => item.id === id);
  if (!entry) return false;
  await fs.rm(await resolveAppTrashPath(entry), { recursive: true, force: false });
  await writeLocalTrashManifest(entries.filter(item => item.id !== id));
  return true;
}

async function emptyLocalTrash() {
  const entries = await readLocalTrashManifest();
  for (const entry of entries) {
    try {
      await fs.rm(await resolveAppTrashPath(entry), { recursive: true, force: false });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  await writeLocalTrashManifest([]);
  return entries.length;
}

async function transferAuthorizedLocalEntries(sourcePaths, destinationPath, move) {
  if (!(await isLocalPathAuthorized(destinationPath))) {
    throw new Error('The destination folder has not been granted to ARLO OS.');
  }
  const destinationStats = await fs.stat(destinationPath);
  if (!destinationStats.isDirectory()) throw new Error('The destination is not a folder.');
  if (!Array.isArray(sourcePaths) || sourcePaths.length === 0 || sourcePaths.length > 100) {
    throw new Error('Select between 1 and 100 items to transfer.');
  }

  const transferred = [];
  for (const sourcePath of sourcePaths) {
    if (!(await isLocalPathAuthorized(sourcePath))) {
      throw new Error('A selected item is outside the folders granted to ARLO OS.');
    }
    const sourceStats = await fs.lstat(sourcePath);
    if (!sourceStats.isFile() && !sourceStats.isDirectory()) {
      throw new Error('A selected item cannot be copied or moved.');
    }
    const baseName = path.basename(sourcePath);
    const normalizedSource = path.resolve(sourcePath);
    const normalizedDestination = path.resolve(destinationPath);
    const relativeDestination = path.relative(normalizedSource, normalizedDestination);
    if (
      move &&
      (normalizedSource === normalizedDestination ||
        (relativeDestination && !relativeDestination.startsWith(`..${path.sep}`) &&
          relativeDestination !== '..' && !path.isAbsolute(relativeDestination)))
    ) {
      throw new Error('A folder cannot be moved into itself or one of its subfolders.');
    }
    let targetPath = path.join(destinationPath, baseName);
    try {
      await fs.access(targetPath);
      if (move) throw new Error(`"${baseName}" already exists in the destination folder.`);
      const extension = path.extname(baseName);
      const stem = extension ? baseName.slice(0, -extension.length) : baseName;
      let copyIndex = 1;
      do {
        const suffix = copyIndex === 1 ? ' - Copy' : ` - Copy ${copyIndex}`;
        targetPath = path.join(destinationPath, `${stem}${suffix}${extension}`);
        copyIndex += 1;
        try {
          await fs.access(targetPath);
        } catch (error) {
          if (error.code === 'ENOENT') break;
          throw error;
        }
      } while (copyIndex < 1000);
    } catch (error) {
      if (error.message.includes('already exists')) throw error;
      if (error.code !== 'ENOENT') throw error;
    }

    if (move) {
      try {
        await fs.rename(sourcePath, targetPath);
      } catch (error) {
        if (error.code !== 'EXDEV') throw error;
        await fs.cp(sourcePath, targetPath, { recursive: true, errorOnExist: true, force: false, dereference: false });
        await shell.trashItem(sourcePath);
      }
    } else {
      await fs.cp(sourcePath, targetPath, { recursive: true, errorOnExist: true, force: false, dereference: false });
    }
    transferred.push(targetPath);
  }
  return transferred;
}

async function openAuthorizedTerminal(targetPath) {
  if (!(await isLocalPathAuthorized(targetPath))) {
    throw new Error('This folder is outside the folders granted to ARLO OS.');
  }
  const command = process.platform === 'win32'
    ? 'wt.exe'
    : process.platform === 'darwin'
      ? 'open'
      : 'x-terminal-emulator';
  const args = process.platform === 'win32'
    ? ['-d', targetPath]
    : process.platform === 'darwin'
      ? ['-a', 'Terminal', targetPath]
      : ['--working-directory', targetPath];
  try {
    await launchDetached(command, args);
  } catch (error) {
    if (process.platform !== 'win32' || error.code !== 'ENOENT') throw error;
    const escapedPath = targetPath.replace(/'/g, "''");
    await launchDetached('powershell.exe', [
      '-NoExit',
      '-Command',
      `Set-Location -LiteralPath '${escapedPath}'`,
    ]);
  }
}

let connectivityCache = null;
let connectivityCacheTime = 0;
let connectivityRequest = null;

async function getConnectivityState() {
  if (connectivityCache && Date.now() - connectivityCacheTime < 1000) {
    return connectivityCache;
  }
  if (connectivityRequest) {
    return connectivityRequest;
  }

  connectivityRequest = queryConnectivityState()
    .then(state => {
      connectivityCache = state;
      connectivityCacheTime = Date.now();
      return state;
    })
    .finally(() => {
      connectivityRequest = null;
    });

  return connectivityRequest;
}

async function queryConnectivityState() {
  const unavailable = {
    supported: false,
    wifi: { enabled: null, connected: null, ssid: null },
    bluetooth: { enabled: null, connected: null, deviceName: null },
  };

  if (process.platform !== 'win32') {
    return unavailable;
  }

  const script = `
[void][System.Reflection.Assembly]::LoadWithPartialName('System.Runtime.WindowsRuntime')
function Wait-WinRtOperation($method, $target, [object[]]$arguments) {
  $operation = $method.Invoke($target, $arguments)
  $resultType = $method.ReturnType.GenericTypeArguments[0]
  $asTask = ([System.WindowsRuntimeSystemExtensions]).GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*' } | Select-Object -First 1
  return $asTask.MakeGenericMethod($resultType).Invoke($null, @($operation)).GetAwaiter().GetResult()
}
$radioType = [Windows.Devices.Radios.Radio, Windows.System.Devices, ContentType=WindowsRuntime]
$radioMethod = $radioType.GetMethod('GetRadiosAsync')
$radios = Wait-WinRtOperation -method $radioMethod -target $null -arguments @()
$wifiRadio = $radios | Where-Object { $_.Kind.ToString() -eq 'WiFi' } | Select-Object -First 1
$bluetoothRadio = $radios | Where-Object { $_.Kind.ToString() -eq 'Bluetooth' } | Select-Object -First 1
$wifiAdapter = Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object { $_.NdisPhysicalMedium -eq 9 } | Select-Object -First 1
$bluetoothAdapter = Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.InstanceId -match '^(USB|PCI)\\\\' -and $_.Status -eq 'OK' } | Select-Object -First 1
$wlanOutput = netsh.exe wlan show interfaces 2>$null
$wlanText = $wlanOutput -join [Environment]::NewLine
$wlanState = [regex]::Match($wlanText, '(?im)^\\s*State\\s*:\\s*(.+?)\\s*$')
$wlanSsid = [regex]::Match($wlanText, '(?im)^\\s*SSID\\s*:\\s*(.+?)\\s*$')
$connectionStatusType = [Windows.Devices.Bluetooth.BluetoothConnectionStatus, Windows.Devices.Bluetooth, ContentType=WindowsRuntime]
$connectionStatus = [Enum]::Parse($connectionStatusType, 'Connected')
$leType = [Windows.Devices.Bluetooth.BluetoothLEDevice, Windows.Devices.Bluetooth, ContentType=WindowsRuntime]
$classicType = [Windows.Devices.Bluetooth.BluetoothDevice, Windows.Devices.Bluetooth, ContentType=WindowsRuntime]
$leSelector = $leType.GetMethod('GetDeviceSelectorFromConnectionStatus').Invoke($null, @($connectionStatus))
$classicSelector = $classicType.GetMethod('GetDeviceSelectorFromConnectionStatus').Invoke($null, @($connectionStatus))
$deviceInformationType = [Windows.Devices.Enumeration.DeviceInformation, Windows.Devices.Enumeration, ContentType=WindowsRuntime]
$findAllMethod = $deviceInformationType.GetMethods() | Where-Object { $_.Name -eq 'FindAllAsync' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType -eq [string] } | Select-Object -First 1
$connectedBleDevices = Wait-WinRtOperation -method $findAllMethod -target $null -arguments @($leSelector)
$connectedClassicDevices = Wait-WinRtOperation -method $findAllMethod -target $null -arguments @($classicSelector)
$connectedDeviceNames = @(@($connectedBleDevices) + @($connectedClassicDevices) | ForEach-Object { $_.Name } | Where-Object { $_ } | Select-Object -Unique)
[PSCustomObject]@{
  wifiEnabled = if ($wifiRadio -and $wifiAdapter) { $wifiRadio.State.ToString() -eq 'On' -and $wifiAdapter.Status -ne 'Disabled' } else { $null }
  wifiConnected = [bool]($wlanState.Success -and $wlanState.Groups[1].Value.Trim() -eq 'connected')
  ssid = if ($wlanState.Success -and $wlanState.Groups[1].Value.Trim() -eq 'connected' -and $wlanSsid.Success) { $wlanSsid.Groups[1].Value.Trim() } else { $null }
  bluetoothEnabled = if ($bluetoothRadio -and $bluetoothAdapter) { $bluetoothRadio.State.ToString() -eq 'On' -and $bluetoothAdapter.Status -eq 'OK' } else { $null }
  bluetoothConnected = [bool]($bluetoothRadio -and $bluetoothRadio.State.ToString() -eq 'On' -and $connectedDeviceNames.Count -gt 0)
  bluetoothDeviceName = if ($bluetoothRadio -and $bluetoothRadio.State.ToString() -eq 'On') { $connectedDeviceNames -join ', ' } else { $null }
} | ConvertTo-Json -Compress
`;

  try {
    const { stdout } = await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      script,
    ], { timeout: 15000, windowsHide: true, maxBuffer: 1024 * 1024 });
    const host = JSON.parse(stdout.trim() || '{}');

    return {
      supported: true,
      wifi: {
        enabled: typeof host.wifiEnabled === 'boolean' ? host.wifiEnabled : null,
        connected: Boolean(host.wifiConnected),
        ssid: typeof host.ssid === 'string' && host.ssid ? host.ssid : null,
      },
      bluetooth: {
        enabled: typeof host.bluetoothEnabled === 'boolean' ? host.bluetoothEnabled : null,
        connected: typeof host.bluetoothConnected === 'boolean' ? host.bluetoothConnected : null,
        deviceName: typeof host.bluetoothDeviceName === 'string' && host.bluetoothDeviceName
          ? host.bluetoothDeviceName
          : null,
      },
    };
  } catch (error) {
    console.warn('[ARLO OS] Connectivity query failed:', error);
    return unavailable;
  }
}

async function setRadioEnabled(kind, enabled) {
  if (process.platform !== 'win32') throw new Error('Radio controls are supported on Windows only.');
  const radioKind = kind === 'wifi' ? 'WiFi' : 'Bluetooth';
  const state = enabled ? 'On' : 'Off';
  const script = `[void][System.Reflection.Assembly]::LoadWithPartialName('System.Runtime.WindowsRuntime')
function Wait-WinRtOperation($method, $target, [object[]]$arguments) {
  $operation = $method.Invoke($target, $arguments)
  $resultType = $method.ReturnType.GenericTypeArguments[0]
  $asTask = ([System.WindowsRuntimeSystemExtensions]).GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*' } | Select-Object -First 1
  return $asTask.MakeGenericMethod($resultType).Invoke($null, @($operation)).GetAwaiter().GetResult()
}
$radioType = [Windows.Devices.Radios.Radio, Windows.System.Devices, ContentType=WindowsRuntime]
$radioStateType = [Windows.Devices.Radios.RadioState, Windows.System.Devices, ContentType=WindowsRuntime]
$statusType = [Windows.Devices.Radios.RadioAccessStatus, Windows.System.Devices, ContentType=WindowsRuntime]
$accessMethod = $radioType.GetMethod('RequestAccessAsync')
$accessStatus = Wait-WinRtOperation -method $accessMethod -target $null -arguments @()
if ($accessStatus.ToString() -ne 'Allowed') { throw '${radioKind} radio access was denied by Windows: ' + $accessStatus.ToString() }
$radioMethod = $radioType.GetMethod('GetRadiosAsync')
$radios = Wait-WinRtOperation -method $radioMethod -target $null -arguments @()
$radio = $radios | Where-Object { $_.Kind.ToString() -eq '${radioKind}' } | Select-Object -First 1
if (-not $radio) { throw '${radioKind} radio was not found.' }
$desiredState = [Enum]::Parse($radioStateType, '${state}')
$setMethod = $radioType.GetMethod('SetStateAsync')
$status = Wait-WinRtOperation -method $setMethod -target $radio -arguments @($desiredState)
if ($status.ToString() -ne 'Allowed') { throw '${radioKind} radio state change was denied by Windows: ' + $status.ToString() }`;
  try {
    await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      script,
    ], { timeout: 30000, windowsHide: true, maxBuffer: 1024 * 1024 });
  } catch {
    const adapterScript = kind === 'wifi'
      ? `$ErrorActionPreference = 'Stop'
$adapter = Get-NetAdapter -Physical -ErrorAction Stop | Where-Object { $_.NdisPhysicalMedium -eq 9 } | Select-Object -First 1
if (-not $adapter) { throw 'No Wi-Fi adapter was found.' }
${enabled ? 'Enable' : 'Disable'}-NetAdapter -Name $adapter.Name -Confirm:$false -ErrorAction Stop`
      : `$ErrorActionPreference = 'Stop'
    $adapter = Get-PnpDevice -Class Bluetooth -ErrorAction Stop | Where-Object { $_.InstanceId -match '^(USB|PCI)\\\\' } | Select-Object -First 1
if (-not $adapter) { throw 'No Bluetooth adapter was found.' }
${enabled ? 'Enable' : 'Disable'}-PnpDevice -InstanceId $adapter.InstanceId -Confirm:$false -ErrorAction Stop`;
    const encodedScript = Buffer.from(adapterScript, 'utf16le').toString('base64');
    const launchScript = `$ErrorActionPreference = 'Stop'; $elevated = Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList '-NoProfile -NonInteractive -EncodedCommand ${encodedScript}' -Wait -PassThru; exit $elevated.ExitCode`;
    await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      launchScript,
    ], { timeout: 60000, windowsHide: true, maxBuffer: 1024 * 1024 });
  }

  connectivityCache = null;
  return getConnectivityState();
}

const setWifiEnabled = enabled => setRadioEnabled('wifi', enabled);
const setBluetoothEnabled = enabled => setRadioEnabled('bluetooth', enabled);

async function scanWifiNetworks(includeProfileNames = false) {
  if (process.platform !== 'win32') {
    throw new Error('Nearby Wi-Fi scanning is currently supported on Windows only.');
  }
  const state = await getConnectivityState();
  if (state.wifi.enabled !== true) {
    throw new Error('Turn on Wi-Fi before scanning for nearby networks.');
  }

  const scannerSource = `
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public static class AbhishekWlanScanner {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  private struct InterfaceInfo {
    public Guid InterfaceGuid;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)] public string Description;
    public uint State;
  }
  [StructLayout(LayoutKind.Sequential)]
  private struct AvailableNetwork {
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)] public string ProfileName;
    public Ssid NetworkSsid;
    public uint BssType;
    public uint NumberOfBssids;
    [MarshalAs(UnmanagedType.Bool)] public bool NetworkConnectable;
    public uint NotConnectableReason;
    public uint NumberOfPhyTypes;
    [MarshalAs(UnmanagedType.ByValArray, SizeConst = 8)] public uint[] PhyTypes;
    [MarshalAs(UnmanagedType.Bool)] public bool MorePhyTypes;
    public uint SignalQuality;
    [MarshalAs(UnmanagedType.Bool)] public bool SecurityEnabled;
    public uint Authentication;
    public uint Cipher;
    public uint Flags;
    public uint Reserved;
  }
  [StructLayout(LayoutKind.Sequential)]
  private struct Ssid {
    public uint Length;
    [MarshalAs(UnmanagedType.ByValArray, SizeConst = 32)] public byte[] Bytes;
  }
  [DllImport("wlanapi.dll")] private static extern int WlanOpenHandle(uint version, IntPtr reserved, out uint negotiatedVersion, out IntPtr client);
  [DllImport("wlanapi.dll")] private static extern int WlanEnumInterfaces(IntPtr client, IntPtr reserved, out IntPtr list);
  [DllImport("wlanapi.dll")] private static extern int WlanScan(IntPtr client, ref Guid interfaceGuid, IntPtr ssid, IntPtr ies, IntPtr reserved);
  [DllImport("wlanapi.dll")] private static extern int WlanGetAvailableNetworkList(IntPtr client, ref Guid interfaceGuid, uint flags, IntPtr reserved, out IntPtr list);
  [DllImport("wlanapi.dll")] private static extern void WlanFreeMemory(IntPtr memory);
  [DllImport("wlanapi.dll")] private static extern int WlanCloseHandle(IntPtr client, IntPtr reserved);

  private static void Check(int error) {
    if (error != 0) throw new Win32Exception(error);
  }
  public static object[] Scan() {
    IntPtr client = IntPtr.Zero;
    IntPtr interfaceList = IntPtr.Zero;
    var results = new List<object>();
    try {
      uint version;
      Check(WlanOpenHandle(2, IntPtr.Zero, out version, out client));
      Check(WlanEnumInterfaces(client, IntPtr.Zero, out interfaceList));
      uint count = (uint)Marshal.ReadInt32(interfaceList);
      var interfaces = new List<Guid>();
      long baseOffset = interfaceList.ToInt64() + 8;
      int interfaceSize = Marshal.SizeOf(typeof(InterfaceInfo));
      for (int i = 0; i < count; i++) {
        var item = (InterfaceInfo)Marshal.PtrToStructure(new IntPtr(baseOffset + i * interfaceSize), typeof(InterfaceInfo));
        interfaces.Add(item.InterfaceGuid);
        Check(WlanScan(client, ref item.InterfaceGuid, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero));
      }
      Thread.Sleep(2500);
      foreach (Guid interfaceGuid in interfaces) {
        Guid currentGuid = interfaceGuid;
        IntPtr networkList = IntPtr.Zero;
        try {
          Check(WlanGetAvailableNetworkList(client, ref currentGuid, 3, IntPtr.Zero, out networkList));
          uint networkCount = (uint)Marshal.ReadInt32(networkList);
          long networkOffset = networkList.ToInt64() + 8;
          int networkSize = Marshal.SizeOf(typeof(AvailableNetwork));
          for (int i = 0; i < networkCount; i++) {
            var network = (AvailableNetwork)Marshal.PtrToStructure(new IntPtr(networkOffset + i * networkSize), typeof(AvailableNetwork));
            uint length = Math.Min(network.NetworkSsid.Length, 32);
            string ssid = Encoding.UTF8.GetString(network.NetworkSsid.Bytes, 0, (int)length);
            if (String.IsNullOrWhiteSpace(ssid)) continue;
            results.Add(new {
              ssid = ssid,
              signal = (int)Math.Min(network.SignalQuality, 100),
              security = network.SecurityEnabled ? ((AuthenticationAlgorithm)network.Authentication).ToString() : "Open",
              profileName = network.ProfileName ?? ""
            });
          }
        } finally {
          if (networkList != IntPtr.Zero) WlanFreeMemory(networkList);
        }
      }
      return results.ToArray();
    } finally {
      if (interfaceList != IntPtr.Zero) WlanFreeMemory(interfaceList);
      if (client != IntPtr.Zero) WlanCloseHandle(client, IntPtr.Zero);
    }
  }
  private enum AuthenticationAlgorithm : uint {
    Open = 1, Shared = 2, WPA = 3, WPA_PSK = 4, WPA2 = 6, WPA2_PSK = 7,
    WPA3 = 8, WPA3_SAE = 9, OWE = 10, WPA3_ENT = 11, WPA3_ENT_192 = 12
  }
}`;
  const script = `Add-Type -TypeDefinition @'\n${scannerSource}\n'@ -ErrorAction Stop\n$items = [AbhishekWlanScanner]::Scan()\nConvertTo-Json -InputObject @($items) -Compress -Depth 4`;
  const { stdout } = await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    script,
  ], { timeout: 20000, windowsHide: true, maxBuffer: 1024 * 1024 });
  const scanned = JSON.parse(stdout.trim() || '[]');
  let networks = Array.isArray(scanned) ? scanned : [scanned];
  if (networks.length === 0) {
    const [{ stdout: netshOutput }, { stdout: profilesOutput }] = await Promise.all([
      execFileAsync('netsh.exe', ['wlan', 'show', 'networks', 'mode=bssid'], {
        timeout: 15000,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      }),
      execFileAsync('netsh.exe', ['wlan', 'show', 'profiles'], {
        timeout: 10000,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      }),
    ]);
    const savedProfiles = new Set(
      [...profilesOutput.matchAll(/^\s*(?:All User Profile|User Profile)\s*:\s*(.+?)\s*$/gim)]
        .map(match => match[1]),
    );
    const ssidMatches = [...netshOutput.matchAll(/^\s*SSID\s+\d+\s*:\s*(.*?)\s*$/gim)];
    networks = ssidMatches.flatMap((match, index) => {
      const ssid = match[1];
      if (!ssid) return [];
      const blockEnd = ssidMatches[index + 1]?.index ?? netshOutput.length;
      const block = netshOutput.slice(match.index, blockEnd);
      const signals = [...block.matchAll(/^\s*Signal\s*:\s*(\d+)\s*%/gim)]
        .map(signal => Number(signal[1]));
      const authentication = block.match(/^\s*Authentication\s*:\s*(.+?)\s*$/im)?.[1];
      const savedProfile = savedProfiles.has(ssid) ? ssid : '';
      return [{
        ssid,
        signal: signals.length ? Math.max(...signals) : 0,
        security: authentication || 'Unknown security',
        profileName: savedProfile,
      }];
    });
  }
  const connectedSsid = state.wifi.connected ? state.wifi.ssid : null;
  const strongestBySsid = new Map();
  for (const network of networks) {
    if (typeof network.ssid !== 'string' || !network.ssid.trim()) continue;
    const previous = strongestBySsid.get(network.ssid);
    if (!previous || Number(network.signal) > Number(previous.signal)) {
      strongestBySsid.set(network.ssid, network);
    }
  }
  return [...strongestBySsid.values()]
    .sort((left, right) => Number(right.signal) - Number(left.signal))
    .map(network => {
      const scannedNetwork = {
        ssid: network.ssid,
        signal: Number(network.signal),
        security: ({
          Open: 'Open',
          WPA_PSK: 'WPA-Personal',
          WPA2_PSK: 'WPA2-Personal',
          WPA3_SAE: 'WPA3-Personal',
          WPA: 'WPA-Enterprise',
          WPA2: 'WPA2-Enterprise',
          WPA3_ENT: 'WPA3-Enterprise',
        })[network.security] || network.security || 'Unknown security',
        connected: network.ssid === connectedSsid,
        saved: typeof network.profileName === 'string' && network.profileName.length > 0,
      };
      if (includeProfileNames) scannedNetwork.profileName = network.profileName || '';
      return scannedNetwork;
    });
}

async function connectWifi(ssid) {
  if (typeof ssid !== 'string' || !ssid.trim() || ssid.length > 32) {
    throw new Error('Choose a valid Wi-Fi network name.');
  }
  const state = await getConnectivityState();
  if (state.wifi.enabled !== true) throw new Error('Turn on Wi-Fi before connecting.');
  const networks = await scanWifiNetworks(true);
  const network = networks.find(item => item.ssid === ssid);
  if (!network) throw new Error('That Wi-Fi network is no longer in range. Scan again and retry.');
  if (!network.saved || !network.profileName) {
    throw new Error('This network has no saved Windows profile. Connect to it in Windows Wi-Fi settings first.');
  }
  await execFileAsync('netsh.exe', [
    'wlan',
    'connect',
    `name=${network.profileName}`,
    `ssid=${network.ssid}`,
  ], { timeout: 15000, windowsHide: true, maxBuffer: 1024 * 1024 });
  await new Promise(resolve => setTimeout(resolve, 1500));
  connectivityCache = null;
  const updatedState = await getConnectivityState();
  if (!updatedState.wifi.connected || updatedState.wifi.ssid !== ssid) {
    throw new Error(`Windows did not connect to ${ssid}. Check its saved profile or password.`);
  }
}

function chooseBluetoothDevice(deviceId) {
  if (!pendingBluetoothSelection) return false;
  const callback = pendingBluetoothSelection;
  pendingBluetoothSelection = null;
  callback(typeof deviceId === 'string' ? deviceId : '');
  return true;
}

async function openWindowsBluetoothSettings() {
  if (process.platform !== 'win32') {
    throw new Error('Windows Bluetooth settings are only available on Windows.');
  }
  await shell.openExternal('ms-settings:bluetooth');
}

/* =========================================================
   WAIT FOR VITE
========================================================= */

function waitForServer(url, timeout = 90000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();

        if (res.statusCode && res.statusCode < 500) {
          resolve();
          return;
        }

        retry();
      });

      req.on('error', retry);

      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - started > timeout) {
        reject(
          new Error(`Timed out waiting for ${url}`)
        );
        return;
      }

      setTimeout(check, 250);
    };

    check();
  });
}

/* =========================================================
   DEVELOPMENT SERVER
========================================================= */

async function startDevServer() {
  const port =
    process.env.ELECTRON_VITE_PORT || '5173';

  const viteCli = path.join(
    __dirname,
    'node_modules',
    'vite',
    'bin',
    'vite.js'
  );

  viteProcess = spawn(
    process.env.npm_node_execpath || 'node',
    [
      viteCli,
      '--host',
      '127.0.0.1',
      '--port',
      port,
    ],
    {
      cwd: __dirname,
      stdio: ['ignore', 'inherit', 'inherit'],
      shell: false,
      windowsHide: true,
      env: {
        ...process.env,
        BROWSER: 'none',
      },
    }
  );

  viteProcess.on('error', (error) => {
    console.error(
      '[ARLO OS] Vite process error:',
      error
    );
  });

  const url = `http://127.0.0.1:${port}`;

  await waitForServer(url);

  return url;
}

/* =========================================================
   SEND UPDATE EVENT TO REACT
========================================================= */

function sendUpdateEvent(channel, payload = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send(
    'app:update',
    {
      channel,
      ...payload,
    }
  );
}

/* =========================================================
   AUTOMATIC UPDATE SYSTEM
========================================================= */

function setupAutoUpdater() {
  if (isStorePackage) {
    console.log(
      '[ARLO OS] Updates for Microsoft Store packages are managed by the Store.'
    );

    return;
  }

  /*
   * Never run the updater while developing.
   */
  if (!app.isPackaged) {
    return;
  }

  console.log(
    '[ARLO OS] Automatic updater enabled.'
  );

  /*
   * Download updates automatically in the background.
   */
  autoUpdater.autoDownload = true;

  /*
   * Install the downloaded update when the
   * application quits/restarts.
   */
  autoUpdater.autoInstallOnAppQuit = true;

  /*
   * Don't install silently while the application
   * is being used.
   */
  autoUpdater.allowPrerelease = false;

  /* -------------------------------------------------------
     CHECKING
  ------------------------------------------------------- */

  autoUpdater.on(
    'checking-for-update',
    () => {
      console.log(
        '[ARLO OS] Checking for updates...'
      );

      sendUpdateEvent(
        'checking'
      );
    }
  );

  /* -------------------------------------------------------
     UPDATE AVAILABLE
  ------------------------------------------------------- */

  autoUpdater.on(
    'update-available',
    (info) => {
      console.log(
        '[ARLO OS] Update available:',
        info.version
      );

      sendUpdateEvent(
        'available',
        {
          version: info.version,
        }
      );
    }
  );

  /* -------------------------------------------------------
     NO UPDATE
  ------------------------------------------------------- */

  autoUpdater.on(
    'update-not-available',
    (info) => {
      console.log(
        '[ARLO OS] Already up to date:',
        info.version
      );

      sendUpdateEvent(
        'not-available',
        {
          version: info.version,
        }
      );
    }
  );

  /* -------------------------------------------------------
     DOWNLOAD PROGRESS
  ------------------------------------------------------- */

  autoUpdater.on(
    'download-progress',
    (progress) => {
      const percent = Math.round(
        progress.percent
      );

      console.log(
        `[ARLO OS] Downloading update: ${percent}%`
      );

      sendUpdateEvent(
        'downloading',
        {
          percent,
          transferred: progress.transferred,
          total: progress.total,
          bytesPerSecond:
            progress.bytesPerSecond,
        }
      );
    }
  );

  /* -------------------------------------------------------
     UPDATE DOWNLOADED
  ------------------------------------------------------- */

  autoUpdater.on(
    'update-downloaded',
    (info) => {
      console.log(
        '[ARLO OS] Update downloaded:',
        info.version
      );

      sendUpdateEvent(
        'downloaded',
        {
          version: info.version,
        }
      );
    }
  );

  /* -------------------------------------------------------
     UPDATE ERROR
  ------------------------------------------------------- */

  autoUpdater.on(
    'error',
    (error) => {
      console.error(
        '[ARLO OS] Auto update error:',
        error
      );

      sendUpdateEvent(
        'error',
        {
          message:
            error?.message ||
            'Unable to update ARLO OS.',
        }
      );
    }
  );

  /*
   * Wait until the application has fully loaded
   * before checking GitHub.
   *
   * This prevents update activity from affecting
   * the startup experience.
   */
  setTimeout(() => {
    autoUpdater
      .checkForUpdates()
      .catch((error) => {
        console.error(
          '[ARLO OS] Update check failed:',
          error
        );
      });
  }, 10000);
}

/* =========================================================
   CREATE WINDOW
========================================================= */

function isAllowedBrowserUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,

    minWidth: 1000,
    minHeight: 650,

    show: false,

    backgroundColor: '#05070b',

    frame: false,

    title: 'ARLO OS',

    // Application icon
    icon: path.join(__dirname, 'build', 'icon.ico'),

    webPreferences: {
      preload: path.join(
        __dirname,
        'electron-preload.cjs'
      ),

      contextIsolation: true,

      nodeIntegration: false,

      sandbox: true,

      webviewTag: true,

      spellcheck: true,
    },
  });

  /* =======================================================
     WINDOW EVENTS
  ======================================================= */

  mainWindow.on(
    'ready-to-show',
    () => {
      mainWindow?.show();
    }
  );

  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    if (!isAllowedBrowserUrl(params.src)) {
      event.preventDefault();
      return;
    }

    delete webPreferences.preload;
    delete webPreferences.preloadURL;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.webSecurity = true;
    webPreferences.allowRunningInsecureContent = false;
    webPreferences.partition = 'persist:abhishek-browser';
  });

  mainWindow.webContents.on('did-attach-webview', (_event, webContents) => {
    webContents.setWindowOpenHandler(({ url }) => {
      if (isAllowedBrowserUrl(url)) {
        mainWindow?.webContents.send('browser:open-url', url);
      }
      return { action: 'deny' };
    });

    const blockUnsafeNavigation = (event, url) => {
      if (!isAllowedBrowserUrl(url)) event.preventDefault();
    };
    webContents.on('will-navigate', blockUnsafeNavigation);
    webContents.on('will-redirect', blockUnsafeNavigation);
  });

  mainWindow.on(
    'closed',
    () => {
      chooseBluetoothDevice('');
      mainWindow = null;
    }
  );

  mainWindow.webContents.on('select-bluetooth-device', (event, devices, callback) => {
    event.preventDefault();
    pendingBluetoothSelection = callback;
    mainWindow?.webContents.send('system:bluetooth-devices', devices.map(device => ({
      deviceId: device.deviceId,
      deviceName: device.deviceName || 'Unnamed Bluetooth device',
      deviceType: device.deviceType,
      paired: device.paired,
      connected: device.connected,
    })));
  });

  /* =======================================================
     EXTERNAL LINKS
  ======================================================= */

  mainWindow.webContents.setWindowOpenHandler(
    ({ url }) => {
      if (/^https?:\/\//i.test(url)) {
        shell.openExternal(url);
      }

      return {
        action: 'deny',
      };
    }
  );

  /* =======================================================
     DEVELOPMENT
  ======================================================= */

  if (isDev) {
    try {
      const url =
        await startDevServer();

      await mainWindow.loadURL(url);
    } catch (error) {
      console.error(
        '[ARLO OS] Failed to start development server:',
        error
      );

      app.quit();
    }

    return;
  }

  /* =======================================================
     PRODUCTION
  ======================================================= */

  const productionIndex = path.join(
    __dirname,
    'dist',
    'index.html'
  );

  try {
    await mainWindow.loadFile(
      productionIndex
    );

  } catch (error) {
    console.error(
      '[ARLO OS] FAILED TO LOAD PRODUCTION RENDERER:',
      error
    );

    app.quit();
  }

  /* =======================================================
     RENDERER DEBUG
  ======================================================= */

  mainWindow.webContents.on(
    'did-finish-load',
    () => {
      if (pendingGhostToggle) {
        pendingGhostToggle = false;
        mainWindow.webContents.send('ghost-ai:toggle');
      }
    }
  );

  mainWindow.webContents.on(
    'did-fail-load',
    (
      _event,
      errorCode,
      errorDescription,
      validatedURL
    ) => {
      console.error(
        '[ARLO OS] Renderer failed to load:',
        {
          errorCode,
          errorDescription,
          validatedURL,
        }
      );
    }
  );
}

/* =========================================================
   ELECTRON READY
========================================================= */

app.whenReady().then(async () => {
  nativeTheme.themeSource = 'dark';
  await protocol.handle('abhishek-local', handleLocalMediaRequest);

  /* =======================================================
     WINDOW CONTROLS
  ======================================================= */

  ipcMain.handle(
    'window:minimize',
    () => {
      mainWindow?.minimize();
    }
  );

  ipcMain.handle(
    'window:maximize',
    () => {
      if (!mainWindow) {
        return false;
      }

      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }

      return mainWindow.isMaximized();
    }
  );

  ipcMain.handle(
    'window:close',
    () => {
      mainWindow?.close();
    }
  );

  ipcMain.handle(
    'window:isMaximized',
    () => {
      return (
        mainWindow?.isMaximized() ??
        false
      );
    }
  );

  /* =======================================================
     EXTERNAL URL
  ======================================================= */

  ipcMain.handle(
    'app:openExternal',
    (_event, url) => {
      if (
        typeof url === 'string' &&
        /^https?:\/\//i.test(url)
      ) {
        return shell.openExternal(url);
      }

      return false;
    }
  );
  /* =======================================================
     APP INFORMATION
  ======================================================= */

  ipcMain.handle(
    'app:platform',
    () => process.platform
  );

  ipcMain.handle(
    'app:version',
    () => app.getVersion()
  );

  ipcMain.handle(
    'app:updateChannel',
    () => !app.isPackaged ? 'development' : isStorePackage ? 'store' : 'direct'
  );

  ipcMain.handle(
    'app:openStoreUpdates',
    async () => {
      if (!isStorePackage || process.platform !== 'win32') return false;
      await shell.openExternal('ms-windows-store://downloadsandupdates');
      return true;
    }
  );

  ipcMain.handle(
    'system:getConnectivityState',
      event => {
        assertTrustedFilesFrame(event);
        return getConnectivityState();
      }
    );
    ipcMain.handle('system:getMediaState', event => {
      assertTrustedFilesFrame(event);
      return hostMediaState;
    });
    ipcMain.handle('system:sendWindowsMediaCommand', async (event, command) => {
      assertTrustedFilesFrame(event);
      if (!['previous', 'playPause', 'next'].includes(command)) {
        throw new Error('Unsupported Windows media command.');
      }
      await sendWindowsMediaCommand(command);
    });
    ipcMain.handle('system:setNotchClipboardMonitoring', (event, enabled) => {
      assertTrustedFilesFrame(event);
      if (typeof enabled !== 'boolean') throw new Error('Invalid notch clipboard monitoring state.');
      if (enabled) startNotchClipboardWatcher();
      else stopNotchClipboardWatcher();
    });
    ipcMain.handle('system:setNotchDeviceMonitoring', (event, enabled) => {
      assertTrustedFilesFrame(event);
      if (typeof enabled !== 'boolean') throw new Error('Invalid notch device monitoring state.');
      if (enabled) startNotchDeviceWatcher();
      else stopNotchDeviceWatcher();
    });
    ipcMain.handle('system:setWifiEnabled', (event, enabled) => {
      assertTrustedFilesFrame(event);
      if (typeof enabled !== 'boolean') throw new Error('Invalid Wi-Fi state.');
      return setWifiEnabled(enabled);
  });
    ipcMain.handle('system:setBluetoothEnabled', (event, enabled) => {
      assertTrustedFilesFrame(event);
      if (typeof enabled !== 'boolean') throw new Error('Invalid Bluetooth state.');
      return setBluetoothEnabled(enabled);
    });
    ipcMain.handle('system:scanWifiNetworks', event => {
      assertTrustedFilesFrame(event);
      return scanWifiNetworks();
    });
    ipcMain.handle('system:connectWifi', (event, ssid) => {
      assertTrustedFilesFrame(event);
      return connectWifi(ssid);
    });
    ipcMain.handle('system:selectBluetoothDevice', (event, deviceId) => {
      assertTrustedFilesFrame(event);
      return chooseBluetoothDevice(deviceId);
    });
    ipcMain.handle('system:openBluetoothSettings', event => {
      assertTrustedFilesFrame(event);
      return openWindowsBluetoothSettings();
    });

  /* =======================================================
     UPDATE CONTROLS
  ======================================================= */

  /*
   * Allow React to manually check for an update.
   */

  ipcMain.handle(
    'app:checkForUpdates',
    async () => {
      if (isStorePackage) {
        return {
          success: false,
          reason: 'store-managed',
        };
      }

      if (!app.isPackaged) {
        return {
          success: false,
          reason: 'development',
        };
      }

      try {
        const result =
          await autoUpdater.checkForUpdates();

        return {
          success: true,
          version:
            result?.updateInfo?.version ||
            null,
        };
      } catch (error) {
        console.error(
          '[ARLO OS] Manual update check failed:',
          error
        );

        return {
          success: false,
          error:
            error?.message ||
            'Update check failed.',
        };
      }
    }
  );

  /*
   * Restart the application and install the
   * downloaded update.
   */

  ipcMain.handle(
    'app:installUpdate',
    () => {
      if (!app.isPackaged || isStorePackage) {
        return false;
      }

      console.log(
        '[ARLO OS] Installing update and restarting...'
      );

      autoUpdater.quitAndInstall(
        false,
        true
      );

      return true;
    }
  );

  /* =======================================================
     CREATE APPLICATION
  ======================================================= */

  await createWindow();
  startHostMediaWatcher();
  registerGhostShortcut('ctrl-shift-space');

  /* =======================================================
     START AUTOMATIC UPDATER
  ======================================================= */

  setupAutoUpdater();

  /* =======================================================
     MACOS
  ======================================================= */

  app.on(
    'activate',
    () => {
      if (
        BrowserWindow.getAllWindows()
          .length === 0
      ) {
        createWindow();
      }
    }
  );
});

/* =========================================================
   CLOSE
========================================================= */

app.on(
  'window-all-closed',
  () => {
    if (viteProcess) {
      viteProcess.kill();
      viteProcess = null;
    }

    if (
      process.platform !== 'darwin'
    ) {
      app.quit();
    }
  }
);

app.on('will-quit', () => {
  hostMediaWatchStopping = true;
  if (hostMediaWatchProcess && hostMediaWatchProcess.exitCode === null) {
    hostMediaWatchProcess.kill();
    hostMediaWatchProcess = null;
  }
  stopNotchDeviceWatcher();
  stopNotchClipboardWatcher();
  globalShortcut.unregisterAll();
  if (ghostWakeProcess && ghostWakeProcess.exitCode === null) {
    ghostWakeProcess.kill();
    ghostWakeProcess = null;
  }
});

/* =========================================================
   BEFORE QUIT
========================================================= */

app.on(
  'before-quit',
  () => {
    if (viteProcess) {
      viteProcess.kill();
      viteProcess = null;
    }
  }
);
