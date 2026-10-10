import assert from 'node:assert/strict';
import test from 'node:test';
import { getFileOpenTarget, openVirtualFile } from '../src/services/fileAssociations.ts';
import { searchSettingsDestinations } from '../src/services/settingsSearch.ts';

test('routes text, code, PDF, and media files to their intended apps', () => {
  assert.equal(getFileOpenTarget('readme.txt'), 'nextpad');
  assert.equal(getFileOpenTarget('guide.md'), 'nextpad');
  assert.equal(getFileOpenTarget('script.ts'), 'codestudio');
  assert.equal(getFileOpenTarget('app.js'), 'codestudio');
  assert.equal(getFileOpenTarget('settings.json'), 'codestudio');
  assert.equal(getFileOpenTarget('manual.PDF'), 'quicklook');
  assert.equal(getFileOpenTarget('recording.mp4', undefined, 'video'), 'tv');
  assert.equal(getFileOpenTarget('song.mp3', undefined, 'audio'), 'music');
});

test('opening a VFS text file queues its original identity for Nextpad', () => {
  const previousWindow = globalThis.window;
  const previousLocalStorage = globalThis.localStorage;
  const stored = new Map();
  const dispatched = [];
  globalThis.localStorage = {
    setItem: (key, value) => stored.set(key, value),
  };
  globalThis.window = {
    dispatchEvent: event => dispatched.push(event),
  };

  try {
    const openedApps = [];
    openVirtualFile({
      id: 'vfs-note',
      name: 'ideas.md',
      path: '/Users/abhishek/Desktop',
      type: 'document',
      extension: 'md',
      content: '# Draft',
    }, appId => openedApps.push(appId), () => assert.fail('Text files should open in an editor.'));

    assert.deepEqual(openedApps, ['nextpad']);
    assert.equal(stored.get('nextpad-pending-open-file'), JSON.stringify({
      name: 'ideas.md',
      content: '# Draft',
      path: '/Users/abhishek/Desktop/ideas.md',
      vfsFileId: 'vfs-note',
    }));
    assert.equal(dispatched[0].type, 'nextpad:open-file');
    assert.equal(dispatched[0].detail.vfsFileId, 'vfs-note');
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousLocalStorage;
  }
});

test('recognizes natural-language Settings searches and targets Jelly Notch', () => {
  const notch = searchSettingsDestinations('Where is Notch?');
  assert.equal(notch[0]?.id, 'jelly-notch');
  assert.equal(notch[0]?.tab, 'appearance');
  assert.equal(notch[0]?.anchor, 'arlo-jelly-notch-settings');
  assert.equal(searchSettingsDestinations('wifi network')[0]?.tab, 'wifi');
  assert.equal(searchSettingsDestinations('dock size')[0]?.tab, 'dock');
});
