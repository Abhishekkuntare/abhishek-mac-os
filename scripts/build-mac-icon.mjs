import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'darwin') {
  throw new Error('The macOS app icon must be generated on macOS with sips and iconutil.');
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(projectRoot, 'src', 'assets', 'arlo-logo-mark.png');
const iconDirectory = path.join(projectRoot, 'build', 'mac');
const iconsetPath = path.join(iconDirectory, 'ARLO.iconset');
const iconPath = path.join(iconDirectory, 'icon.icns');
const iconSizes = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024],
];

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed with status ${result.status}.`);
};

await fs.mkdir(iconDirectory, { recursive: true });
await fs.rm(iconsetPath, { recursive: true, force: true });
await fs.mkdir(iconsetPath);

for (const [name, size] of iconSizes) {
  run('sips', [
    '-z',
    String(size),
    String(size),
    sourcePath,
    '--out',
    path.join(iconsetPath, name),
  ]);
}

run('iconutil', ['-c', 'icns', iconsetPath, '-o', iconPath]);
await fs.rm(iconsetPath, { recursive: true, force: true });
console.log(`[ARLO OS] Generated macOS app icon: ${iconPath}`);
