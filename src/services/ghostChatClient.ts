import { APP_REGISTRY } from '../data/defaultApps';
import { detectGhostCommandLanguage } from './ghostCommands';
import { executeRegisteredTool } from './ghostToolRegistry';
import { GhostChatError } from '../types/ghostAgent';
import { SUPPORTED_DETECTIVE_TOOLS } from '../components/system/detectiveModel';
import { appendGhostActivity, routeGhostRequest, startGhostActivity } from './ghostOrchestrator';
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
  detective: GhostContext['detective'],
  requestId = crypto.randomUUID(),
): Promise<string> => {
  const latestUserMessage = [...messages].reverse().find(message => message.role === 'user')?.content ?? '';
  detective = routeGhostRequest(latestUserMessage, detective);
  startGhostActivity(requestId, latestUserMessage, detective.name, detective.role);
  const api = window.electronAPI;
  if (!api?.ghostAIChat) {
    appendGhostActivity(requestId, 'failed', 'Ghost AI is unavailable in this environment.');
    throw new GhostChatError('UNAVAILABLE', 'Ghost AI chat is only available in the ARLO OS desktop app.');
  }

  const context: GhostContext = {
    displayName,
    detective,
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
      appendGhostActivity(requestId, 'running', 'Contacting the configured AI provider.');
      return await api.ghostAIChat(payload);
    } catch (error) {
      appendGhostActivity(requestId, 'failed', 'The AI provider request failed.');
      throw new GhostChatError(
        'AI_SERVICE_ERROR',
        "Ghost couldn't connect to its AI service.",
        error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
      );
    }
  };
  const firstResponse = await callAgent(request);
  if (!firstResponse.success) {
    appendGhostActivity(requestId, 'failed', firstResponse.message);
    throw new GhostChatError(firstResponse.code, firstResponse.message, firstResponse.details);
  }
  if (firstResponse.kind === 'message') {
    appendGhostActivity(requestId, 'completed', 'Ghost replied without running a desktop action.');
    return firstResponse.message;
  }

  const registeredTools = new Set<string>(SUPPORTED_DETECTIVE_TOOLS);
  const allowedTools = new Set(detective.permittedTools.filter(tool => registeredTools.has(tool)));
  const results: GhostToolResult[] = [];
  for (const call of firstResponse.toolCalls) {
    appendGhostActivity(requestId, 'running', `Running registered action: ${call.name.replaceAll('_', ' ')}.`);
    const result = allowedTools.has(call.name)
      ? await executeRegisteredTool(call, host)
      : {
          id: call.id,
          name: call.name,
          success: false,
          result: `${detective.name} is not permitted to use this capability.`,
        };
    results.push(result);
    appendGhostActivity(
      requestId,
      'running',
      `${call.name.replaceAll('_', ' ')} ${result.success ? 'completed' : 'failed'}: ${result.result}`,
    );
  }
  const nextResponse = await callAgent({
    ...request,
    pendingToolCalls: firstResponse.toolCalls,
    toolResults: results,
  });
  if (!nextResponse.success) {
    appendGhostActivity(requestId, 'failed', nextResponse.message);
    throw new GhostChatError(nextResponse.code, nextResponse.message, nextResponse.details);
  }
  if (nextResponse.kind !== 'message') {
    appendGhostActivity(requestId, 'failed', 'The response could not be safely completed.');
    throw new GhostChatError('TOOL_LIMIT', 'Ghost could not complete that action safely.');
  }

  const appCallIndex = firstResponse.toolCalls.findIndex(call => call.name === 'open_app');
  const language = detectGhostCommandLanguage(messages.at(-1)?.content ?? '');
  if (appCallIndex !== -1 && firstResponse.toolCalls.length === 1) {
    const appId = firstResponse.toolCalls[appCallIndex].args.app;
    const appName = typeof appId === 'string' && Object.hasOwn(APP_REGISTRY, appId)
      ? APP_REGISTRY[appId].name
      : 'That app';
    if (results[appCallIndex].success) {
      appendGhostActivity(requestId, 'completed', results[appCallIndex].result);
      return language === 'hi'
        ? `ठीक है, ${displayName}। ${appName} खुल गया है।`
        : language === 'mr'
          ? `झाले, ${displayName}. ${appName} उघडले आहे.`
          : `Done, ${displayName}. ${appName} is open.`;
    }
    const appFailure = results[appCallIndex].result;
    appendGhostActivity(requestId, 'failed', appFailure);
    return language === 'hi'
      ? `${appName} नहीं खुला।${appFailure === `${appName} couldn't be opened.` ? '' : ` ${appFailure}`}`
      : language === 'mr'
        ? `${appName} उघडता आले नाही.${appFailure === `${appName} couldn't be opened.` ? '' : ` ${appFailure}`}`
        : appFailure === `${appName} couldn't be opened.`
          ? appFailure
          : `${appName} couldn't be opened. ${appFailure}`;
  }

  if (results.some(result => !result.success)) {
    const summary = language === 'hi'
      ? 'मैं वह काम पूरा नहीं कर सकी।'
      : language === 'mr'
        ? 'मला ती कृती पूर्ण करता आली नाही.'
        : "I couldn't complete that action.";
    appendGhostActivity(requestId, 'failed', 'One or more requested actions failed.');
    return `${summary}\n\n${results.map(result => `${result.name}: ${result.success ? 'Success' : 'Failed'} — ${result.result}`).join('\n')}`;
  }
  appendGhostActivity(requestId, 'completed', 'All registered actions completed successfully.');
  return `${nextResponse.message}\n\n${results.map(result => `${result.name}: ${result.result}`).join('\n')}`;
};
