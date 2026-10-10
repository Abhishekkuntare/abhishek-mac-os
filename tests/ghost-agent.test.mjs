import assert from 'node:assert/strict';
import test from 'node:test';
import { GHOST_GEMINI_MODEL, isValidGhostToolResults, runGhostAgent } from '../ghost-agent-service.mjs';
import { resolveGeminiApiKey } from '../ghost-api-key.mjs';
import { getLocalFallbackReply, runGhostChat } from '../src/services/ghostChatClient.ts';
import { executeGhostCommand } from '../src/services/ghostCommands.ts';
import { isMeaningfulGhostTranscript, matchGhostWakePhrase } from '../src/services/ghostWakePhrases.ts';
import {
  appendGhostActivity,
  getGhostActivityTasks,
  routeGhostRequest,
  startGhostActivity,
} from '../src/services/ghostOrchestrator.ts';
import { executeRegisteredTool, GHOST_TOOLS } from '../src/services/ghostToolRegistry.ts';

const detective = {
  name: 'Scout',
  role: 'Desktop operator',
  personality: 'Practical and attentive.',
  description: 'Handles desktop tasks.',
  skills: ['Open apps'],
  instructions: '',
  permittedTools: ['open_app', 'close_app', 'create_desktop_item', 'show_desktop', 'get_local_time', 'get_battery_status', 'set_focus_mode', 'search_files', 'get_system_info', 'arrange_window'],
};

const request = {
  model: GHOST_GEMINI_MODEL,
  messages: [{ role: 'user', content: 'Hello Ghost' }],
  context: {
    displayName: 'Abhishek',
    availableApps: [{ id: 'music', name: 'Music' }],
    detective,
  },
};

test('accepts result payloads for every registered Ghost tool', () => {
  const toolArgs = {
    open_app: { app: 'music' },
    close_app: { app: 'music' },
    create_desktop_item: { type: 'file', name: 'notes.txt' },
    rename_desktop_item: { name: 'notes.txt', new_name: 'ideas.txt' },
    delete_desktop_item: { name: 'ideas.txt' },
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

test('routes specialist requests to the assigned detective and uses that detective permissions', () => {
  const current = { id: 'scout', ...detective };
  const assigned = routeGhostRequest('Please debug this TypeScript error', current);
  assert.equal(assigned.id, 'violet');
  assert.equal(assigned.role, 'Coding assistant');
  assert.deepEqual(assigned.permittedTools, ['open_app', 'get_system_info', 'search_files', 'arrange_window']);
  assert.equal(routeGhostRequest('Hello there', current), current);
});

test('records bounded progress events and final activity status', () => {
  const id = `activity-${Date.now()}`;
  startGhostActivity(id, 'Find a document', 'Ruby', 'File investigator');
  appendGhostActivity(id, 'running', 'Searching authorized locations.');
  appendGhostActivity(id, 'completed', 'Found one matching document.');
  const [task] = getGhostActivityTasks().filter(candidate => candidate.id === id);
  assert.equal(task.status, 'completed');
  assert.equal(task.events.at(-1).summary, 'Found one matching document.');
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

test('avoids replaying signed function calls when asking Gemini to summarize verified tool results', async () => {
  const thoughtSignature = 'opaque-gemini-signature';
  let followUpRequest;
  const firstClient = {
    models: {
      generateContent: async () => ({
        functionCalls: [{ id: 'call-music', name: 'open_app', args: { app: 'music' } }],
        candidates: [{
          content: {
            parts: [{
              functionCall: { id: 'call-music', name: 'open_app', args: { app: 'music' } },
              thoughtSignature,
            }],
          },
        }],
      }),
    },
  };
  const toolResponse = await runGhostAgent(firstClient, request, AbortSignal.timeout(1000));
  assert.equal(toolResponse.toolCalls[0].thoughtSignature, thoughtSignature);

  const followUpClient = {
    models: {
      generateContent: async input => {
        followUpRequest = input;
        return { text: 'Music is open.' };
      },
    },
  };
  await runGhostAgent(followUpClient, {
    ...request,
    pendingToolCalls: toolResponse.toolCalls,
    toolResults: [{
      id: 'call-music',
      name: 'open_app',
      success: true,
      result: 'Music opened.',
    }],
  }, AbortSignal.timeout(1000));
  const resultPrompt = followUpRequest.contents.at(-1).parts[0].text;
  assert.match(resultPrompt, /open_app: SUCCESS — Music opened\./);
  assert.equal(JSON.stringify(followUpRequest.contents).includes(thoughtSignature), false);
  assert.equal(JSON.stringify(followUpRequest.contents).includes('"functionCall"'), false);
  assert.equal(followUpRequest.config.tools, undefined);
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

test('local Ghost shortcuts enforce the selected detective capability list', async () => {
  let opened = false;
  const result = await executeGhostCommand('Open Music', {
    openApp: () => { opened = true; return true; },
    closeApp: () => false,
    showDesktop: async () => {},
    createDesktopItem: () => '',
    renameDesktopItem: () => null,
    deleteDesktopItem: () => null,
    updateSettings: () => {},
  }, undefined, undefined, ['get_local_time']);
  assert.equal(opened, false);
  assert.match(result.reply, /does not have the open app capability/);
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

test('enables Focus Mode locally for natural requests including “the focus mode”', async () => {
  const changes = [];
  const host = {
    openApp: () => true,
    closeApp: () => true,
    showDesktop: async () => {},
    createDesktopItem: () => '',
    renameDesktopItem: () => null,
    deleteDesktopItem: () => null,
    updateSettings: settings => changes.push(settings),
  };

  const enabled = await executeGhostCommand('enable the focus mode', host);
  const disabled = await executeGhostCommand('turn off the focus mode', host);

  assert.deepEqual(changes, [{ doNotDisturb: true }, { doNotDisturb: false }]);
  assert.equal(enabled.reply, 'Focus Mode is on.');
  assert.equal(disabled.reply, 'Focus Mode is off.');
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
  assert.deepEqual(matchGhostWakePhrase('Hey Scout, open Finder', ['Scout']), { command: 'open Finder' });
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

test('verified tool result is sent to Gemini without replaying a function call', async () => {
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
  assert.match(followUp.contents.at(-1).parts[0].text, /open_app: SUCCESS — Music opened\./);
  assert.equal(JSON.stringify(followUp.contents).includes('"functionCall"'), false);
  assert.equal(followUp.config.tools, undefined);
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

test('registered file search, system information, and window arrangement use explicit host actions', async () => {
  const arranged = [];
  const host = {
    searchAuthorizedFiles: async query => [`${query}: report.txt — C:\\Authorized\\report.txt`],
    getSystemInfo: async () => 'CPU usage: 12%. Memory: 3.0 GB of 8.0 GB.',
    arrangeWindow: (appId, position) => {
      arranged.push({ appId, position });
      return { success: true, result: `Music moved to ${position}.` };
    },
  };
  const search = await executeRegisteredTool({
    id: 'search-1',
    name: 'search_files',
    args: { query: 'report' },
  }, host);
  const systemInfo = await executeRegisteredTool({
    id: 'system-info-1',
    name: 'get_system_info',
    args: {},
  }, host);
  const arrange = await executeRegisteredTool({
    id: 'arrange-1',
    name: 'arrange_window',
    args: { app: 'music', position: 'left' },
  }, host);
  assert.equal(search.success, true);
  assert.match(search.result, /C:\\Authorized\\report\.txt/);
  assert.equal(systemInfo.result, 'CPU usage: 12%. Memory: 3.0 GB of 8.0 GB.');
  assert.equal(arrange.success, true);
  assert.deepEqual(arranged, [{ appId: 'music', position: 'left' }]);
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
      detective,
      'test-create-desktop-file',
    );
    assert.deepEqual(created, [{ type: 'file', name: 'index.py' }]);
    assert.equal(payloads[1].toolResults[0].success, true);
    assert.equal(answer, 'Created index.py.\n\ncreate_desktop_item: Created file "index.py" on the desktop.');

    calls = 0;
    const failed = await runGhostChat(
      [{ role: 'user', content: 'Create a Python file named index.py on my desktop.' }],
      'Abhishek',
      { openApp: () => false, createDesktopItem: () => { throw new Error('A file already exists.'); } },
      detective,
      'test-create-desktop-file-failure',
    );
    assert.equal(payloads[3].toolResults[0].success, false);
    assert.equal(failed, "I couldn't complete that action.\n\ncreate_desktop_item: Failed — A file already exists.");
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
      detective,
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
      detective,
      'test-open-music-failure',
    );
    assert.equal(answer, "Music couldn't be opened.");
  } finally {
    globalThis.window = previousWindow;
  }
});

test('chat client refuses a tool that is outside the selected detective permissions', async () => {
  const previousWindow = globalThis.window;
  const calls = [];
  globalThis.window = {
    electronAPI: {
      ghostAIChat: async payload => {
        calls.push(payload);
        return calls.length === 1
          ? {
              success: true,
              kind: 'tool_calls',
              toolCalls: [{ id: 'focus-1', name: 'set_focus_mode', args: { enabled: true } }],
            }
          : { success: true, kind: 'message', message: 'Focus Mode enabled.' };
      },
    },
  };
  let focusChanged = false;
  try {
    const answer = await runGhostChat(
      [{ role: 'user', content: 'Enable Focus Mode.' }],
      'Abhishek',
      { openApp: () => false, setFocusMode: () => { focusChanged = true; } },
      { ...detective, permittedTools: ['open_app'] },
      'test-disallowed-tool',
    );
    assert.equal(focusChanged, false);
    assert.equal(calls[1].toolResults[0].success, false);
    assert.match(calls[1].toolResults[0].result, /not permitted/);
    assert.match(answer, /Failed — Scout is not permitted/);
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
        detective,
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

test('Ghost camera capture tools require and report explicit notch approval', async () => {
  const unavailable = await executeRegisteredTool({
    id: 'camera-unavailable',
    name: 'take_camera_photo',
    args: {},
  }, { openApp: () => false });
  assert.equal(unavailable.success, false);

  let requested;
  const host = {
    openApp: () => false,
    requestCameraCapture: async (kind, durationSeconds) => {
      requested = { kind, durationSeconds };
      return { success: false, result: 'Camera capture was declined.' };
    },
  };
  const declined = await executeRegisteredTool({
    id: 'camera-declined',
    name: 'take_camera_photo',
    args: {},
  }, host);
  assert.equal(declined.success, false);
  assert.equal(requested.kind, 'photo');

  const recorded = await executeRegisteredTool({
    id: 'camera-video',
    name: 'record_camera_video',
    args: { duration_seconds: '7' },
  }, host);
  assert.equal(recorded.success, false);
  assert.deepEqual(requested, { kind: 'video', durationSeconds: 7 });

  const invalidDuration = await executeRegisteredTool({
    id: 'camera-video-invalid',
    name: 'record_camera_video',
    args: { duration_seconds: '60' },
  }, host);
  assert.equal(invalidDuration.success, false);
});
