import { APP_REGISTRY } from '../data/defaultApps';

export type GhostCommandLanguage = 'en' | 'hi' | 'mr';

interface GhostBatteryStatus {
  available: boolean;
  level: number;
  charging: boolean;
  plugged: boolean;
}

interface GhostCommandHost {
  openApp: (appId: string) => boolean;
  closeApp: (appId: string) => boolean;
  showDesktop: () => Promise<void>;
  createDesktopItem: (type: 'folder' | 'file', name: string) => string;
  renameDesktopItem: (name: string, newName: string) => string | null;
  deleteDesktopItem: (name: string) => string | null;
  updateSettings: (fields: { doNotDisturb: boolean }) => void;
  getBatteryStatus?: () => GhostBatteryStatus;
}

export type PendingCreateType = 'folder' | 'file';
export interface GhostCommandResult {
  reply: string;
  pendingCreate?: PendingCreateType;
}

const APP_ALIASES: Record<string, string> = {
  'code studio': 'codestudio',
  'development workspace': 'codestudio',
  'my terminal': 'terminal',
  documents: 'finder',
  files: 'finder',
  'file manager': 'finder',
  'संगीत': 'music',
  'म्यूजिक': 'music',
  'म्युझिक': 'music',
  'संगीत प्लेयर': 'music',
  'संगीत वादक': 'music',
  'दस्तावेज़': 'finder',
  'दस्तावेज': 'finder',
  'कागदपत्रे': 'finder',
  'फाइलें': 'finder',
  'फ़ाइलें': 'finder',
  'सेटिंग्स': 'settings',
  'सेटिंग': 'settings',
  'टर्मिनल': 'terminal',
  'कॅलेंडर': 'calendar',
  'कैलेंडर': 'calendar',
  'कॅल्क्युलेटर': 'calculator',
  'कैलकुलेटर': 'calculator',
  'ब्राउज़र': 'browser',
  'ब्राउजर': 'browser',
  'फोटो': 'photos',
  'फ़ोटो': 'photos',
  'नोट्स': 'notes',
  'घोस्ट एआई': 'ghostai',
};

const normalize = (value: string) =>
  value.trim().toLocaleLowerCase().replace(/[.!?।॥]+$/g, '').replace(/\s+/g, ' ');

export const detectGhostCommandLanguage = (
  command: string,
  detectedLanguage?: string,
): GhostCommandLanguage => {
  if (detectedLanguage === 'hi' || detectedLanguage?.startsWith('hi-')) return 'hi';
  if (detectedLanguage === 'mr' || detectedLanguage?.startsWith('mr-')) return 'mr';
  if (/[ऀ-ॿ]/u.test(command)) {
    return /(?:आहे|माझे|माझा|काय|किती|वाजले|आजचा|आजची|उघड|करा|दाखव|कोणता|कोणती|वार|आत्ता)/u.test(command)
      ? 'mr'
      : 'hi';
  }
  if (/\b(?:atta|aata|aajcha|aajchi|kay aahe|kiti vajle|ughad|dakhav|kara|konta|konti|vaar)\b/i.test(command)) return 'mr';
  if (/\b(?:samay kya|kitne baje|aaj kaun|aaj ki tareekh|kholo|dikhao|banao)\b/i.test(command)) return 'hi';
  return 'en';
};

const localized = (language: GhostCommandLanguage, en: string, hi: string, mr: string) =>
  language === 'hi' ? hi : language === 'mr' ? mr : en;

const cleanAddressing = (command: string) =>
  command.replace(/^(?:(?:hey|hi|hello|okay|ok)\s+)?(?:ghost|ghost ai|lily|brad|घोस्ट|लिली|ब्रैड)\s*[,،:]?\s*/i, '').trim();

const appIdFor = (value: string) => {
  const target = normalize(value)
    .replace(/\s+(?:for me|please|now|app|please open)$/i, '')
    .replace(/[“”"']/g, '')
    .trim();
  const alias = APP_ALIASES[target];
  if (alias) return alias;
  return Object.values(APP_REGISTRY).find(app =>
    app.installed &&
    (normalize(app.name) === target || normalize(app.id) === target),
  )?.id;
};

const readClock = (language: GhostCommandLanguage, now: Date) => {
  if (language === 'en') {
    const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(now);
    const date = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    return `It’s ${time} on ${date}.`;
  }
  const locale = language === 'hi' ? 'hi-IN' : 'mr-IN';
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(now);
  const date = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  return language === 'hi' ? `अभी ${time} बजे हैं, ${date}।` : `आत्ता ${time} वाजले आहेत, ${date}।`;
};

const readBattery = (
  language: GhostCommandLanguage,
  status?: GhostBatteryStatus,
) => {
  if (!status?.available) {
    return localized(
      language,
      'This device does not report battery status.',
      'इस डिवाइस की बैटरी स्थिति उपलब्ध नहीं है।',
      'या डिव्हाइसची बॅटरी स्थिती उपलब्ध नाही.',
    );
  }
  const level = Math.round(status.level);
  if (language === 'hi') {
    const state = status.charging ? 'चार्ज हो रही है' : status.plugged ? 'प्लग इन है' : 'बैटरी पर चल रही है';
    return `बैटरी ${level}% है और ${state}।`;
  }
  if (language === 'mr') {
    const state = status.charging ? 'चार्ज होत आहे' : status.plugged ? 'प्लग इन आहे' : 'बॅटरीवर चालू आहे';
    return `बॅटरी ${level}% आहे आणि ${state}।`;
  }
  const state = status.charging ? 'plugged in and charging' : status.plugged ? 'plugged in' : 'running on battery';
  return `Battery is at ${level}% and ${state}.`;
};

const getCreateCommand = (command: string) => {
  const english = command.match(/^(?:please )?(?:create|make|add)\s+(?:(?:(?:a|the)\s+)?new\s+|a\s+|the\s+)?(folder|file)\b(.*)$/);
  if (english) {
    const name = english[2]
      .trim()
      .replace(/^on (?:the )?desktop\b/i, '')
      .replace(/\s+on (?:the )?desktop$/i, '')
      .replace(/^(?:and )?(?:name(?: it| is)?|called|named)\s+(?:is\s+)?/i, '')
      .trim();
    return { type: english[1] as PendingCreateType, name: name || undefined };
  }

  const hasCreateIntent = /(?:बनाओ|बनाएं|बनाइए|तैयार करो|तैयार करा|तयार करा|तयार कर|banao|banaye|tayyar kara|tayaar kara)/i.test(command);
  const type: PendingCreateType | null = /(?:folder|फोल्डर|फ़ोल्डर|फोल्डर)/i.test(command)
    ? 'folder'
    : /(?:file|फाइल|फ़ाइल)/i.test(command)
      ? 'file'
      : null;
  if (!hasCreateIntent || !type) return null;

  const name = command
    .replace(/^(?:डेस्कटॉप पर|डेस्कटॉपवर|desktop पर|desktopवर)\s*/i, '')
    .replace(/(?:एक|नया|नई|नए|नवीन|नवी|नवा)\s*/g, '')
    .replace(/(?:create|make|add|बनाओ|बनाएं|बनाइए|तैयार करो|तैयार करा|तयार करा|तयार कर|banao|banaye|tayyar kara|tayaar kara)/gi, '')
    .replace(/(?:folder|फोल्डर|फ़ोल्डर|फोल्डर|file|फाइल|फ़ाइल)/gi, '')
    .replace(/(?:जिसका नाम|जिसका|नाम|नाव|नावाचे|नावाचा|नावाची|called|named|name it|name is|नावाने|है|आहे|का|की|चे|चं)/gi, '')
    .replace(/^(?:on (?:the )?desktop)\s*/i, '')
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { type, name: name || undefined };
};

export const executeGhostCommand = async (
  rawCommand: string,
  host: GhostCommandHost,
  pendingCreate?: PendingCreateType,
  detectedLanguage?: string,
): Promise<GhostCommandResult | null> => {
  const language = detectGhostCommandLanguage(rawCommand, detectedLanguage);
  const command = normalize(cleanAddressing(rawCommand));

  if (pendingCreate) {
    const name = command.replace(/^(?:call it|name it|named|it is|it's|is|नाम|नाव)\s+/i, '').trim();
    if (!name) return { reply: `Tell me the name for the ${pendingCreate}.`, pendingCreate };
    return { reply: host.createDesktopItem(pendingCreate, name) };
  }

  if (/^(?:hello|hi|hey)(?: ghost| ghost ai| lily| brad)?$/i.test(command)) {
    return {
      reply: localized(
        language,
        'Hello. I’m here and ready to help.',
        'नमस्ते। मैं आपकी मदद के लिए तैयार हूँ।',
        'नमस्कार. मी मदतीसाठी तयार आहे.',
      ),
    };
  }

  if (/(?:what(?:'s| is) the time|what time is it|current time|tell me the time|what day is it|what(?:'s| is) today'?s date|today'?s date|समय क्या हुआ|अभी कितने बजे|आज कौन सा दिन|आज की तारीख क्या|samay kya hua|abhi kitne baje|aaj kaun sa din|aaj ki tareekh kya|आत्ता किती वाजले|आज कोणता वार|आजची तारीख काय|atta kiti vajle|aaj konta vaar|aajchi tarikh kay)/i.test(command)) {
    return { reply: readClock(language, new Date()) };
  }

  if (/(?:battery|charging|charge status|बैटरी|चार्ज|चार्जिंग|battery kitni|battery kiti|charge aahe ka|charging ahe ka|charging hai kya)/i.test(command)) {
    return { reply: readBattery(language, host.getBatteryStatus?.()) };
  }

  if (/^(?:show|reveal) (?:the )?desktop$/.test(command) || /^(?:डेस्कटॉप दिखाओ|डेस्कटॉप दाखव|desktop dikhाओ)$/i.test(command)) {
    await host.showDesktop();
    return { reply: localized(language, 'Showing the desktop.', 'डेस्कटॉप दिखा रही हूँ।', 'डेस्कटॉप दाखवत आहे.') };
  }

  if (/^(?:enable|turn on|start) focus(?: mode)?$/.test(command)) {
    host.updateSettings({ doNotDisturb: true });
    return { reply: localized(language, 'Focus Mode is on.', 'फोकस मोड चालू है।', 'फोकस मोड सुरू आहे.') };
  }

  if (/^(?:disable|turn off|stop) focus(?: mode)?$/.test(command)) {
    host.updateSettings({ doNotDisturb: false });
    return { reply: localized(language, 'Focus Mode is off.', 'फोकस मोड बंद है।', 'फोकस मोड बंद आहे.') };
  }

  const createMatch = getCreateCommand(command);
  if (createMatch) {
    const { type, name } = createMatch;
    if (!name) {
      return {
        reply: localized(
          language,
          `What should I name the ${type}?`,
          `${type === 'folder' ? 'फ़ोल्डर' : 'फ़ाइल'} का नाम क्या रखूँ?`,
          `${type === 'folder' ? 'फोल्डर' : 'फाइल'}चे नाव काय ठेवू?`,
        ),
        pendingCreate: type,
      };
    }
    return { reply: host.createDesktopItem(type, name) };
  }

  const renameMatch = command.match(/^rename (.+?) to (.+)$/);
  if (renameMatch) {
    const result = host.renameDesktopItem(renameMatch[1], renameMatch[2]);
    return { reply: result ?? `I couldn't find "${renameMatch[1]}" on the desktop.` };
  }

  const deleteMatch = command.match(/^(?:delete|remove|move to trash) (.+)$/);
  if (deleteMatch) {
    if (/^(?:all|all files|all folders|everything|everything on (?:the )?desktop|the desktop)$/i.test(deleteMatch[1])) {
      return { reply: 'I won’t move everything at once. Tell me the exact desktop item you want moved to Trash.' };
    }
    const result = host.deleteDesktopItem(deleteMatch[1]);
    return { reply: result ?? `I couldn't find "${deleteMatch[1]}" on the desktop.` };
  }

  const closeMatch = command.match(/^(?:(?:please|can you)\s+)?(?:close|quit|exit|बंद करो|बंद करें|बंद करा|बंद कर|band kara)\s+(?:the |my )?(.+)$/i);
  if (closeMatch) {
    const target = normalize(closeMatch[1]);
    const appId = ['it', 'this', 'app', 'window', 'current app', 'this window'].includes(target)
      ? ''
      : appIdFor(target);
    if (appId === undefined) return { reply: `I couldn't find an open app named "${closeMatch[1]}".` };
    return {
      reply: host.closeApp(appId)
        ? localized(
          language,
          `Closing ${appId ? APP_REGISTRY[appId].name : 'the front app'}.`,
          `${appId ? APP_REGISTRY[appId].name : 'वर्तमान ऐप'} बंद कर रही हूँ।`,
          `${appId ? APP_REGISTRY[appId].name : 'सध्याचे अॅप'} बंद करत आहे.`,
        )
        : localized(language, 'That app is not open.', 'वह ऐप खुला नहीं है।', 'ते अॅप उघडे नाही.'),
    };
  }

  const openMatch = command.match(/^(?:(?:please|can you|could you|hey ghost|ghost)\s+)?(?:open|launch|start|show|play|खोलो|खोलिए|खोल|उघड|उघडा|दिखाओ|दाखव|दाखवा|चालू करो|चालू करा|chalu kara)\s+(?:the |my )?(.+)$/i)
    ?? command.match(/^(.+?)\s+(?:खोलो|खोलिए|खोल|उघड|उघडा|दिखाओ|दाखव|दाखवा|चालू करो|चालू करा|please open|open it)$/i);
  if (!openMatch) return null;

  const requestedApp = normalize(openMatch[1]).replace(/\s+(?:for me|please|now|app)$/i, '').trim();
  const appId = appIdFor(requestedApp);
  if (!appId || appId === 'trash') return null;

  return {
    reply: host.openApp(appId)
      ? localized(
        language,
        `Opening ${APP_REGISTRY[appId].name}.`,
        `${APP_REGISTRY[appId].name} खोल रही हूँ।`,
        `${APP_REGISTRY[appId].name} उघडत आहे.`,
      )
      : `${APP_REGISTRY[appId].name} couldn't be opened.`,
  };
};
