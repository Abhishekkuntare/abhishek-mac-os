import assert from 'node:assert/strict';
import test from 'node:test';
import { GHOST_GEMINI_MODEL, isValidGhostToolResults, runGhostAgent } from '../ghost-agent-service.mjs';
import { resolveGeminiApiKey } from '../ghost-api-key.mjs';
import { getLocalFallbackReply, runGhostChat } from '../src/services/ghostChatClient.ts';
import { executeGhostCommand } from '../src/services/ghostCommands.ts';
import { isMeaningfulGhostTranscript, matchGhostWakePhrase } from '../src/services/ghostWakePhrases.ts';
import { executeRegisteredTool, GHOST_TOOLS } from '../src/services/ghostToolRegistry.ts';

const request = {
  model: GHOST_GEMINI_MODEL,
  messages: [{ role: 'user', content: 'Hello Ghost' }],
  context: {
    displayName: 'Abhishek',
    availableApps: [{ id: 'music', name: 'Music' }],
  },
};

test('accepts result payloads for every registered Ghost tool', () => {
  const toolArgs = {
    open_app: { app: 'music' },
    close_app: { app: 'music' },
    create_desktop_item: { type: 'file', name: 'notes.txt' },
    show_desktop: {},
    get_local_time: {},
    get_battery_status: {},
    set_focus_mode: { enabled: true },
  };
  for (const [name, args] of Object.entries(toolArgs)) {
    const call = { id: `call-${name}`, name, args };
    const result = { id: call.id, name, success: true, result: 'Action completed.' };
    assert.equal(isValidGhostToolResults([call], [result]), true, `${name} results should be accepted`);
  }
});

test('rejects mismatched or unregistered Ghost tool results', () => {
  const call = { id: 'call-unknown', name: 'run_terminal_command', args: { command: 'whoami' } };
  assert.equal(isValidGhostToolResults([call], [{ ...call, success: true, result: 'done' }]), false);
  const validCall = { id: 'call-open-app', name: 'open_app', args: { app: 'music' } };
  assert.equal(isValidGhostToolResults([validCall], [{ ...validCall, name: 'close_app', success: true, result: 'done' }]), false);
  assert.equal(isValidGhostToolResults([], []), false);
});

test('rejects malformed arguments for otherwise registered Ghost tools', () => {
  const invalidCalls = [
    { id: 'bad-open', name: 'open_app', args: {} },
    { id: 'bad-focus', name: 'set_focus_mode', args: { enabled: 'yes' } },
    { id: 'extra-field', name: 'show_desktop', args: { app: 'music' } },
  ];
  for (const call of invalidCalls) {
    assert.equal(
      isValidGhostToolResults([call], [{ ...call, success: true, result: 'done' }]),
      false,
      `${call.name} malformed arguments should be rejected`,
    );
  }
});

test('uses the requested Gemini model and answers a personalized greeting', async () => {
  let payload;
  const client = {
    models: {
      generateContent: async input => {
        payload = input;
        return { text: 'Hello, Abhishek. How can I help?' };
      },
    },
  };

  const response = await runGhostAgent(client, request, AbortSignal.timeout(1000));
  assert.equal(GHOST_GEMINI_MODEL, 'gemini-3.8-flash');
  assert.equal(payload.model, 'gemini-3.8-flash');
  assert.match(payload.config.systemInstruction, /Abhishek/);
  assert.equal(response.kind, 'message');
  assert.equal(response.message, 'Hello, Abhishek. How can I help?');
});

test('retries temporary Gemini service errors and returns a successful response', async () => {
  let attempts = 0;
  const client = {
    models: {
      generateContent: async () => {
        attempts += 1;
        if (attempts < 3) {
          const error = new Error('The service is currently experiencing high demand.');
          error.status = 503;
          throw error;
        }
        return { text: 'Hello, Abhishek. How can I help?' };
      },
    },
  };

  const response = await runGhostAgent(client, request, AbortSignal.timeout(3000));
  assert.equal(attempts, 3);
  assert.equal(response.message, 'Hello, Abhishek. How can I help?');
});

test('does not retry non-transient Gemini errors', async () => {
  let attempts = 0;
  const client = {
    models: {
      generateContent: async () => {
        attempts += 1;
        const error = new Error('Invalid model.');
        error.status = 404;
        throw error;
      },
    },
  };

  await assert.rejects(
    runGhostAgent(client, request, AbortSignal.timeout(1000)),
    /Invalid model/,
  );
  assert.equal(attempts, 1);
});

test('asks Gemini to call open_app for a conversational Music request', async () => {
  const client = {
    models: {
      generateContent: async input => {
        assert.equal(input.contents.at(-1).parts[0].text, 'Can you open music for me?');
        const toolNames = input.config.tools.flatMap(tool => tool.functionDeclarations.map(fn => fn.name));
        for (const name of ['open_app', 'close_app', 'create_desktop_item', 'show_desktop', 'get_local_time', 'get_battery_status', 'set_focus_mode']) {
          assert.ok(toolNames.includes(name), `${name} should be registered with Gemini`);
        }
        return {
          functionCalls: [{ id: 'call-music', name: 'open_app', args: { app: 'music' } }],
        };
      },
    },
  };

  const response = await runGhostAgent(client, {
    ...request,
    messages: [{ role: 'user', content: 'Can you open music for me?' }],
  }, AbortSignal.timeout(1000));
  assert.deepEqual(response, {
    kind: 'tool_calls',
    toolCalls: [{ id: 'call-music', name: 'open_app', args: { app: 'music' } }],
  });
});

test('direct Music command accepts natural phrasing without “for me” as app name', async () => {
  const opened = [];
  const result = await executeGhostCommand('open music for me', {
    openApp: appId => { opened.push(appId); return true; },
    closeApp: () => false,
    showDesktop: async () => {},
    createDesktopItem: () => '',
    renameDesktopItem: () => null,
    deleteDesktopItem: () => null,
    updateSettings: () => {},
  });
  assert.deepEqual(opened, ['music']);
  assert.equal(result?.reply, 'Opening Music.');
});

test('natural app-opening requests are handled locally without Gemini', async () => {
  const opened = [];
  const result = await executeGhostCommand('Could you please open Finder for me?', {
    openApp: appId => { opened.push(appId); return true; },
    closeApp: () => false,
    showDesktop: async () => {},
    createDesktopItem: () => '',
    renameDesktopItem: () => null,
    deleteDesktopItem: () => null,
    updateSettings: () => {},
  });
  assert.deepEqual(opened, ['finder']);
  assert.equal(result?.reply, 'Opening Finder.');
});

test('natural polite app-closing requests are handled locally without Gemini', async () => {
  const closed = [];
  const result = await executeGhostCommand('Can you please close the calculator?', {
    openApp: () => true,
    closeApp: appId => { closed.push(appId); return true; },
    showDesktop: async () => {},
    createDesktopItem: () => '',
    renameDesktopItem: () => null,
    deleteDesktopItem: () => null,
    updateSettings: () => {},
  });
  assert.deepEqual(closed, ['calculator']);
  assert.equal(result?.reply, 'Closing Calculator.');
});

test('direct app closing distinguishes a closed app from an open app', async () => {
  const closed = [];
  const host = {
    openApp: () => true,
    closeApp: appId => { closed.push(appId); return appId === 'music'; },
    showDesktop: async () => {},
    createDesktopItem: () => '',
    renameDesktopItem: () => null,
    deleteDesktopItem: () => null,
    updateSettings: () => {},
  };
  const success = await executeGhostCommand('close music for me', host);
  const failure = await executeGhostCommand('close notes', host);
  assert.deepEqual(closed, ['music', 'notes']);
  assert.equal(success.reply, 'Closing Music.');
  assert.match(failure.reply, /not open/);
});

test('local time and battery questions return current system facts', async () => {
  const host = {
    openApp: () => true,
    closeApp: () => true,
    showDesktop: async () => {},
    createDesktopItem: () => '',
    renameDesktopItem: () => null,
    deleteDesktopItem: () => null,
    updateSettings: () => {},
    getBatteryStatus: () => ({ available: true, level: 87, charging: true, plugged: true }),
  };
  const time = await executeGhostCommand('What time is it and what day is today?', host);
  assert.match(time.reply, /^It’s .+ on .+\.$/);
  const battery = await executeGhostCommand('What is charging now?', host);
  assert.equal(battery.reply, 'Battery is at 87% and plugged in and charging.');
  const unavailable = await executeGhostCommand('What is my battery?', {
    ...host,
    getBatteryStatus: () => ({ available: false, level: 0, charging: false, plugged: false }),
  });
  assert.match(unavailable.reply, /does not report battery status/);
});

test('Hindi and Marathi text commands open Music and create desktop folders', async () => {
  const opened = [];
  const created = [];
  const host = {
    openApp: appId => { opened.push(appId); return true; },
    closeApp: () => true,
    showDesktop: async () => {},
    createDesktopItem: (type, name) => { created.push({ type, name }); return `Created ${type} "${name}" on the desktop.`; },
    renameDesktopItem: () => null,
    deleteDesktopItem: () => null,
    updateSettings: () => {},
  };
  const hindiOpen = await executeGhostCommand('म्यूजिक खोलो', host, undefined, 'hi');
  const marathiOpen = await executeGhostCommand('म्युझिक उघडा', host, undefined, 'mr');
  const hindiFolder = await executeGhostCommand('डेस्कटॉप पर फोल्डर बनाओ Projects', host, undefined, 'hi');
  const marathiFolder = await executeGhostCommand('डेस्कटॉपवर फोल्डर तयार करा Notes', host, undefined, 'mr');
  const file = await executeGhostCommand('Create a file index.py on desktop', host);
  assert.deepEqual(opened, ['music', 'music']);
  assert.match(hindiOpen.reply, /खोल रही हूँ/);
  assert.match(marathiOpen.reply, /उघडत आहे/);
  assert.deepEqual(created, [
    { type: 'folder', name: 'projects' },
    { type: 'folder', name: 'notes' },
    { type: 'file', name: 'index.py' },
  ]);
  assert.equal(hindiFolder.reply, 'Created folder "projects" on the desktop.');
  assert.equal(marathiFolder.reply, 'Created folder "notes" on the desktop.');
  assert.equal(file.reply, 'Created file "index.py" on the desktop.');
});

test('Gemini API key resolution prefers a non-empty environment key and falls back to dotenv', () => {
  assert.equal(resolveGeminiApiKey(' environment-key ', 'dotenv-key'), 'environment-key');
  assert.equal(resolveGeminiApiKey('', ' dotenv-key '), 'dotenv-key');
  assert.equal(resolveGeminiApiKey('  ', undefined), '');
});

test('wake phrases accept Hey Lily and Hey Ghost in English, Hindi, and Marathi', () => {
  assert.deepEqual(matchGhostWakePhrase('Hey Lily, open Finder'), { command: 'open Finder' });
  assert.deepEqual(matchGhostWakePhrase('Hey Ghost open Music'), { command: 'open Music' });
  assert.deepEqual(matchGhostWakePhrase('Hi Ghost'), { command: '' });
  assert.deepEqual(matchGhostWakePhrase('Hi Lily'), { command: '' });
  assert.deepEqual(matchGhostWakePhrase('Hi Lily, open Finder'), { command: 'open Finder' });
  assert.deepEqual(matchGhostWakePhrase('Hello Lily'), { command: '' });
  assert.deepEqual(matchGhostWakePhrase('नमस्ते लिली'), { command: '' });
  assert.deepEqual(matchGhostWakePhrase('जागो लिली, टर्मिनल खोलो'), { command: 'टर्मिनल खोलो' });
  assert.deepEqual(matchGhostWakePhrase('namaskar Lily'), { command: '' });
  assert.equal(matchGhostWakePhrase('Hey Assistant, open Finder'), null);
});

test('ignores punctuation-only wake-listener transcripts but accepts multilingual words', () => {
  assert.equal(isMeaningfulGhostTranscript('.'), false);
  assert.equal(isMeaningfulGhostTranscript('...?!'), false);
  assert.equal(isMeaningfulGhostTranscript('   '), false);
  assert.equal(isMeaningfulGhostTranscript('open Music'), true);
  assert.equal(isMeaningfulGhostTranscript('फ़ोल्डर बनाओ'), true);
});

test('unavailable AI replies stay concise and offer local desktop actions without an error banner', () => {
  assert.match(getLocalFallbackReply('en'), /opening or closing apps/);
  assert.doesNotMatch(getLocalFallbackReply('en'), /offline|API key|Gemini|unavailable/i);
  assert.match(getLocalFallbackReply('hi'), /ऐप खोलने या बंद करने/);
  assert.match(getLocalFallbackReply('mr'), /apps उघडणे किंवा बंद करणे/);
});

test('tool result is sent to Gemini before producing the final response', async () => {
  let followUp;
  const client = {
    models: {
      generateContent: async input => {
        followUp = input;
        return { text: 'Done, Abhishek. Music is open.' };
      },
    },
  };

  const response = await runGhostAgent(client, {
    ...request,
    pendingToolCalls: [{ id: 'call-music', name: 'open_app', args: { app: 'music' } }],
    toolResults: [{ id: 'call-music', name: 'open_app', success: true, result: 'Music opened.' }],
  }, AbortSignal.timeout(1000));
  assert.equal(followUp.contents.at(-2).parts[0].functionCall.name, 'open_app');
  assert.equal(followUp.contents.at(-1).parts[0].functionResponse.response.success, true);
  assert.equal(response.message, 'Done, Abhishek. Music is open.');
});

test('registered open_app dispatches only installed apps and reports failures honestly', async () => {
  const opened = [];
  const host = { openApp: appId => { opened.push(appId); return true; } };
  const success = await executeRegisteredTool({
    id: 'call-music',
    name: 'open_app',
    args: { app: 'music' },
  }, host);
  assert.deepEqual(opened, ['music']);
  assert.equal(success.success, true);

  const failure = await executeRegisteredTool({
    id: 'call-missing',
    name: 'open_app',
    args: { app: 'not-installed' },
  }, host);
  assert.equal(failure.success, false);
  assert.match(failure.result, /No installed app/);
  assert.deepEqual(opened, ['music']);
});

test('registered desktop, battery, and time tools call only their provided host APIs', async () => {
  const created = [];
  const host = {
    openApp: () => false,
    createDesktopItem: (type, name) => {
      created.push({ type, name });
      return `Created ${type} "${name}" on the desktop.`;
    },
    getBatteryStatus: () => ({ available: true, level: 73, charging: false, plugged: false }),
    getLocalTime: () => 'Monday, October 5, 2026 at 10:28 AM',
  };
  const file = await executeRegisteredTool({
    id: 'call-file',
    name: 'create_desktop_item',
    args: { type: 'file', name: 'index.py' },
  }, host);
  const battery = await executeRegisteredTool({
    id: 'call-battery',
    name: 'get_battery_status',
    args: {},
  }, host);
  const time = await executeRegisteredTool({
    id: 'call-time',
    name: 'get_local_time',
    args: {},
  }, host);
  assert.equal(file.success, true);
  assert.equal(battery.result, 'Battery is at 73% and running on battery.');
  assert.equal(time.result, 'Monday, October 5, 2026 at 10:28 AM');
  assert.deepEqual(created, [{ type: 'file', name: 'index.py' }]);
});

test('chat client dispatches a registered create-file request and refuses to claim a failed creation', async () => {
  const previousWindow = globalThis.window;
  let calls = 0;
  const payloads = [];
  globalThis.window = {
    electronAPI: {
      ghostAIChat: async payload => {
        payloads.push(payload);
        calls += 1;
        return calls === 1
          ? {
              success: true,
              kind: 'tool_calls',
              toolCalls: [{ id: 'call-create-file', name: 'create_desktop_item', args: { type: 'file', name: 'index.py' } }],
            }
          : { success: true, kind: 'message', message: 'Created index.py.' };
      },
    },
  };
  const created = [];
  try {
    const answer = await runGhostChat(
      [{ role: 'user', content: 'Create a Python file named index.py on my desktop.' }],
      'Abhishek',
      { openApp: () => false, createDesktopItem: (type, name) => { created.push({ type, name }); return 'Created file "index.py" on the desktop.'; } },
      'test-create-desktop-file',
    );
    assert.deepEqual(created, [{ type: 'file', name: 'index.py' }]);
    assert.equal(payloads[1].toolResults[0].success, true);
    assert.equal(answer, 'Created index.py.');

    calls = 0;
    const failed = await runGhostChat(
      [{ role: 'user', content: 'Create a Python file named index.py on my desktop.' }],
      'Abhishek',
      { openApp: () => false, createDesktopItem: () => { throw new Error('A file already exists.'); } },
      'test-create-desktop-file-failure',
    );
    assert.equal(payloads[3].toolResults[0].success, false);
    assert.equal(failed, "I couldn't complete that action.");
  } finally {
    globalThis.window = previousWindow;
  }
});

test('chat client executes Gemini open_app request and reports verified success only', async () => {
  const calls = [];
  const previousWindow = globalThis.window;
  globalThis.window = {
    electronAPI: {
      ghostAIChat: async payload => {
        calls.push(payload);
        return calls.length === 1
          ? {
              success: true,
              kind: 'tool_calls',
              toolCalls: [{ id: 'call-music', name: 'open_app', args: { app: 'music' } }],
            }
          : { success: true, kind: 'message', message: 'Done!' };
      },
    },
  };
  const opened = [];
  try {
    const answer = await runGhostChat(
      [{ role: 'user', content: 'Can you open music for me?' }],
      'Abhishek',
      { openApp: appId => { opened.push(appId); return true; } },
      'test-open-music',
    );
    assert.deepEqual(opened, ['music']);
    assert.equal(calls[1].pendingToolCalls[0].name, 'open_app');
    assert.equal(calls[1].toolResults[0].success, true);
    assert.equal(answer, 'Done, Abhishek. Music is open.');
  } finally {
    globalThis.window = previousWindow;
  }
});

test('chat client does not claim success when an app could not be opened', async () => {
  const previousWindow = globalThis.window;
  let callNumber = 0;
  globalThis.window = {
    electronAPI: {
      ghostAIChat: async () => {
        callNumber += 1;
        return callNumber === 1
          ? {
              success: true,
              kind: 'tool_calls',
              toolCalls: [{ id: 'call-music', name: 'open_app', args: { app: 'music' } }],
            }
          : { success: true, kind: 'message', message: 'Music opened!' };
      },
    },
  };
  try {
    const answer = await runGhostChat(
      [{ role: 'user', content: 'Can you open music for me?' }],
      'Abhishek',
      { openApp: () => false },
      'test-open-music-failure',
    );
    assert.equal(answer, "Music couldn't be opened.");
  } finally {
    globalThis.window = previousWindow;
  }
});

test('chat client preserves the structured missing-key response', async () => {
  const previousWindow = globalThis.window;
  globalThis.window = {
    electronAPI: {
      ghostAIChat: async () => ({
        success: false,
        code: 'MISSING_API_KEY',
        message: 'Ghost AI needs a Gemini API key.',
      }),
    },
  };
  try {
    await assert.rejects(
      runGhostChat(
        [{ role: 'user', content: 'Hello Ghost' }],
        'Abhishek',
        { openApp: () => false },
        'test-missing-key',
      ),
      error => error.code === 'MISSING_API_KEY' && error.message === 'Ghost AI needs a Gemini API key.',
    );
  } finally {
    globalThis.window = previousWindow;
  }
});

test('unregistered and high-risk tools cannot execute', async () => {
  const definitions = new Map(GHOST_TOOLS.map(tool => [tool.name, tool]));
  assert.equal(definitions.get('open_app').risk, 'LOW');
  assert.equal(definitions.get('create_folder').risk, 'LOW');
  assert.equal(definitions.get('move_file').risk, 'MEDIUM');
  assert.equal(definitions.get('delete_file').risk, 'HIGH');
  assert.equal(definitions.get('run_terminal_command').risk, 'CRITICAL');

  const host = { openApp: () => assert.fail('No application should open') };
  const terminal = await executeRegisteredTool({
    id: 'call-terminal',
    name: 'run_terminal_command',
    args: { command: 'whoami' },
  }, host);
  assert.equal(terminal.success, false);

  const unknown = await executeRegisteredTool({
    id: 'call-arbitrary',
    name: 'execute_anything',
    args: {},
  }, host);
  assert.equal(unknown.success, false);
});
