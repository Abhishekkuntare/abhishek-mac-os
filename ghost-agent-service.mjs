export const GHOST_GEMINI_MODEL = 'gemini-3.8-flash';
export const GHOST_TOOL_DECLARATIONS = [
  {
    name: 'open_app',
    description: 'Open one installed ARLO OS app by its exact app id.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        app: {
          type: 'string',
          description: 'Exact id from the available installed apps list.',
        },
      },
      required: ['app'],
      additionalProperties: false,
    },
  },
  {
    name: 'close_app',
    description: 'Close one open ARLO OS app, or close the currently focused app when app is an empty string.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        app: {
          type: 'string',
          description: 'Exact app id, or an empty string for the currently focused app.',
        },
      },
      required: ['app'],
      additionalProperties: false,
    },
  },
  {
    name: 'create_desktop_item',
    description: 'Create one file or folder on the virtual desktop. Ask what to name it when no name was provided.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['file', 'folder'] },
        name: { type: 'string', description: 'File or folder name, including the extension for files.' },
      },
      required: ['type', 'name'],
      additionalProperties: false,
    },
  },
  {
    name: 'show_desktop',
    description: 'Minimize visible windows and show the desktop.',
    parametersJsonSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_local_time',
    description: 'Read the current local time and date on the user device.',
    parametersJsonSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_battery_status',
    description: 'Read the current device battery percentage and whether it is charging or plugged in.',
    parametersJsonSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'set_focus_mode',
    description: 'Turn Focus Mode on or off in ARLO OS.',
    parametersJsonSchema: {
      type: 'object',
      properties: { enabled: { type: 'boolean' } },
      required: ['enabled'],
      additionalProperties: false,
    },
  },
];

const GHOST_TOOL_NAMES = new Set(GHOST_TOOL_DECLARATIONS.map(tool => tool.name));

export const isValidGhostToolResults = (pendingToolCalls, toolResults) => {
  if (
    !Array.isArray(pendingToolCalls) ||
    pendingToolCalls.length < 1 ||
    pendingToolCalls.length > 5 ||
    !Array.isArray(toolResults) ||
    toolResults.length !== pendingToolCalls.length
  ) {
    return false;
  }

  return pendingToolCalls.every((call, index) => {
    const result = toolResults[index];
    const declaration = call && GHOST_TOOL_DECLARATIONS.find(tool => tool.name === call.name);
    const properties = declaration?.parametersJsonSchema.properties ?? {};
    const required = declaration?.parametersJsonSchema.required ?? [];
    const validArgs = call?.args &&
      typeof call.args === 'object' &&
      !Array.isArray(call.args) &&
      Object.keys(call.args).every(key => Object.hasOwn(properties, key)) &&
      required.every(key => Object.hasOwn(call.args, key)) &&
      Object.entries(call.args).every(([key, value]) => {
        const type = properties[key]?.type;
        return type === 'string'
          ? typeof value === 'string'
          : type === 'boolean'
            ? typeof value === 'boolean'
            : false;
      });
    return Boolean(
      call &&
      typeof call.id === 'string' &&
      /^[\w-]{1,120}$/.test(call.id) &&
      typeof call.name === 'string' &&
      GHOST_TOOL_NAMES.has(call.name) &&
      validArgs &&
      result &&
      result.id === call.id &&
      result.name === call.name &&
      typeof result.success === 'boolean' &&
      typeof result.result === 'string' &&
      result.result.length <= 2_000,
    );
  });
};

const isRetryableGeminiError = error => {
  const status = Number(error?.status ?? error?.code);
  if ([408, 429, 500, 502, 503, 504].includes(status)) return true;
  if ([400, 401, 403, 404].includes(status)) return false;

  const message = String(error?.message ?? error);
  return /\b(?:408|429|500|502|503|504)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|ECONNRESET|ETIMEDOUT|fetch failed/i.test(message);
};

const waitBeforeRetry = (delayMs, signal) => new Promise((resolve, reject) => {
  if (!signal) {
    setTimeout(resolve, delayMs);
    return;
  }
  if (signal.aborted) {
    reject(signal.reason instanceof Error ? signal.reason : new Error('Ghost AI request was cancelled.'));
    return;
  }

  const onAbort = () => {
    clearTimeout(timer);
    reject(signal.reason instanceof Error ? signal.reason : new Error('Ghost AI request was cancelled.'));
  };
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', onAbort);
    resolve();
  }, delayMs);
  signal.addEventListener('abort', onAbort, { once: true });
});

const generateContentWithRetry = async (genAI, request, signal) => {
  const retryDelays = [350, 900];
  for (let attempt = 0; ; attempt += 1) {
    if (signal?.aborted) {
      throw signal.reason instanceof Error ? signal.reason : new Error('Ghost AI request was cancelled.');
    }
    try {
      return await genAI.models.generateContent(request);
    } catch (error) {
      if (attempt >= retryDelays.length || !isRetryableGeminiError(error) || signal?.aborted) {
        throw error;
      }
      await waitBeforeRetry(retryDelays[attempt], signal);
    }
  }
};

const toGeminiContent = (message) => ({
  role: message.role === 'assistant' ? 'model' : 'user',
  parts: [{ text: message.content }],
});

export const runGhostAgent = async (genAI, request, signal) => {
  const displayName = request.context.displayName;
  const apps = request.context.availableApps
    .map(app => `${app.id} (${app.name})`)
    .join(', ');
  const contents = request.messages.map(toGeminiContent);

  if (request.pendingToolCalls) {
    contents.push({
      role: 'model',
      parts: request.pendingToolCalls.map(call => ({
        functionCall: {
          id: call.id,
          name: call.name,
          args: call.args,
        },
      })),
    });
    contents.push({
      role: 'user',
      parts: request.toolResults.map(result => ({
        functionResponse: {
          id: result.id,
          name: result.name,
          response: {
            success: result.success,
            result: result.result,
          },
        },
      })),
    });
  }

  const response = await generateContentWithRetry(genAI, {
    model: GHOST_GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: [
        `You are Ghost, the helpful OS-level assistant in ARLO OS. Address the user as ${displayName}.`,
        'Reply in the same language the user used, including Hindi or Marathi when appropriate.',
        'For a greeting such as "Hello Ghost", reply naturally and warmly, for example: "Hello, ' + displayName + '. How can I help?"',
        `Installed apps available to open: ${apps || 'none'}.`,
        'When asked to open an installed app, call open_app with its exact app id. Never claim an app was opened without a successful tool result.',
        'After successful open_app, respond briefly, for example: "Done, ' + displayName + '. Music is open." If the tool reports failure, clearly say the app could not be opened.',
        'Use close_app, create_desktop_item, show_desktop, get_local_time, get_battery_status, and set_focus_mode only for the matching user request. Describe tool failures honestly and never imply an action happened when its tool result says it failed.',
        'For a file or folder, preserve the exact name the user requested. Never create a file or folder if the user has not provided a name; ask a follow-up question instead.',
        'Use only explicitly declared tools. Do not claim to have performed actions that were not confirmed by a tool result.',
      ].join(' '),
      tools: [{ functionDeclarations: GHOST_TOOL_DECLARATIONS }],
      abortSignal: signal,
    },
  }, signal);

  const calls = response.functionCalls;
  if (Array.isArray(calls) && calls.length > 0) {
    return {
      kind: 'tool_calls',
      toolCalls: calls.map((call, index) => ({
        id: call.id || `ghost-tool-${Date.now()}-${index}`,
        name: call.name || '',
        args: call.args ?? {},
      })),
    };
  }

  const message = response.text;
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('Gemini returned an empty response.');
  }
  return { kind: 'message', message: message.trim() };
};
