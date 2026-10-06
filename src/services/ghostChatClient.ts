import { APP_REGISTRY } from '../data/defaultApps';
import { detectGhostCommandLanguage } from './ghostCommands';
import { executeRegisteredTool } from './ghostToolRegistry';
import { GhostChatError } from '../types/ghostAgent';
import type {
  GhostContext,
  GhostMessage,
  GhostToolCall,
  GhostToolHost,
  GhostToolResult,
} from '../types/ghostAgent';

export const getLocalFallbackReply = (
  language: ReturnType<typeof detectGhostCommandLanguage>,
) => {
  const localFeatures = [
    'I can help with desktop tasks like opening or closing apps, creating files and folders, checking the time or battery, and changing Focus Mode.',
    'मैं ऐप खोलने या बंद करने, फ़ाइलें और फ़ोल्डर बनाने, समय या बैटरी बताने और फ़ोकस मोड बदलने जैसे डेस्कटॉप काम कर सकती हूँ।',
    'मी apps उघडणे किंवा बंद करणे, files आणि folders तयार करणे, वेळ किंवा battery सांगणे आणि Focus Mode बदलणे अशी desktop कामे करू शकते.',
  ];
  const index = language === 'hi' ? 1 : language === 'mr' ? 2 : 0;
  return localFeatures[index];
};

export const runGhostChat = async (
  messages: GhostMessage[],
  displayName: string,
  host: GhostToolHost,
  requestId = crypto.randomUUID(),
): Promise<string> => {
  const api = window.electronAPI;
  if (!api?.ghostAIChat) {
    throw new GhostChatError('UNAVAILABLE', 'Ghost AI chat is only available in the ARLO OS desktop app.');
  }

  const context: GhostContext = {
    displayName,
    availableApps: Object.values(APP_REGISTRY)
      .filter(app => app.installed)
      .map(app => ({ id: app.id, name: app.name })),
  };
  const request = {
    model: 'gemini-3.8-flash' as const,
    requestId,
    messages,
    context,
  };
  const callAgent = async (payload: typeof request & {
    pendingToolCalls?: GhostToolCall[];
    toolResults?: GhostToolResult[];
  }) => {
    try {
      return await api.ghostAIChat(payload);
    } catch (error) {
      throw new GhostChatError(
        'AI_SERVICE_ERROR',
        "Ghost couldn't connect to its AI service.",
        error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
      );
    }
  };
  const firstResponse = await callAgent(request);
  if (!firstResponse.success) {
    throw new GhostChatError(firstResponse.code, firstResponse.message, firstResponse.details);
  }
  if (firstResponse.kind === 'message') return firstResponse.message;

  const results = await Promise.all(firstResponse.toolCalls.map(call => executeRegisteredTool(call, host)));
  const nextResponse = await callAgent({
    ...request,
    pendingToolCalls: firstResponse.toolCalls,
    toolResults: results,
  });
  if (!nextResponse.success) {
    throw new GhostChatError(nextResponse.code, nextResponse.message, nextResponse.details);
  }
  if (nextResponse.kind !== 'message') {
    throw new GhostChatError('TOOL_LIMIT', 'Ghost could not complete that action safely.');
  }

  const appCallIndex = firstResponse.toolCalls.findIndex(call => call.name === 'open_app');
  const language = detectGhostCommandLanguage(messages.at(-1)?.content ?? '');
  if (appCallIndex !== -1) {
    const appId = firstResponse.toolCalls[appCallIndex].args.app;
    const appName = typeof appId === 'string' && Object.hasOwn(APP_REGISTRY, appId)
      ? APP_REGISTRY[appId].name
      : 'That app';
    if (results[appCallIndex].success) {
      return language === 'hi'
        ? `ठीक है, ${displayName}। ${appName} खुल गया है।`
        : language === 'mr'
          ? `झाले, ${displayName}. ${appName} उघडले आहे.`
          : `Done, ${displayName}. ${appName} is open.`;
    }
    return language === 'hi'
      ? `${appName} नहीं खुला।`
      : language === 'mr'
        ? `${appName} उघडता आले नाही.`
        : `${appName} couldn't be opened.`;
  }

  if (results.some(result => !result.success)) {
    return language === 'hi'
      ? 'मैं वह काम पूरा नहीं कर सकी।'
      : language === 'mr'
        ? 'मला ती कृती पूर्ण करता आली नाही.'
        : "I couldn't complete that action.";
  }
  return nextResponse.message;
};
