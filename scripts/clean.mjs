import { rm } from 'node:fs/promises';

for (const path of ['dist', 'release']) {
  await rm(path, { recursive: true, force: true });
  console.log(`Removed ${path}/`);
}
