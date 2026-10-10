import type { WindowSnapType } from './desktop';

export type GhostActionRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GhostTask = 'CHAT' | 'EXECUTE_TOOL';

export interface GhostPermission {
  required: boolean;
  description?: string;
}

export interface GhostContext {
  displayName: string;
  availableApps: Array<{ id: string; name: string }>;
  detective: {
    name: string;
    role: string;
    personality: string;
    description: string;
    skills: string[];
    instructions: string;
    permittedTools: string[];
  };
}

export interface GhostToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  thoughtSignature?: string;
}

export interface GhostToolResult {
  id: string;
  name: string;
  success: boolean;
  result: string;
}

export interface GhostMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GhostTool {
  name: string;
  description: string;
  risk: GhostActionRisk;
  permission: GhostPermission;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, { type: 'STRING' | 'BOOLEAN'; description: string }>;
    required?: string[];
  };
}

export interface GhostChatRequest {
  model: string;
  requestId: string;
  messages: GhostMessage[];
  context: GhostContext;
  toolResults?: GhostToolResult[];
  pendingToolCalls?: GhostToolCall[];
}

export type GhostChatResponse =
  | { success: true; kind: 'message'; message: string }
  | { success: true; kind: 'tool_calls'; toolCalls: GhostToolCall[] }
  | { success: false; code: string; message: string; details?: string };

export interface GhostToolHost {
  openApp: (appId: string) => boolean;
  closeApp?: (appId: string) => boolean;
  createDesktopItem?: (type: 'folder' | 'file', name: string) => string;
  renameDesktopItem?: (name: string, newName: string) => string | null;
  deleteDesktopItem?: (name: string) => string | null;
  showDesktop?: () => Promise<void>;
  getLocalTime?: () => string;
  getBatteryStatus?: () => {
    available: boolean;
    level: number;
    charging: boolean;
    plugged: boolean;
  };
  setFocusMode?: (enabled: boolean) => void;
  requestCameraCapture?: (
    kind: 'photo' | 'video',
    durationSeconds?: number,
  ) => Promise<{ success: boolean; result: string }>;
  searchAuthorizedFiles?: (query: string) => Promise<string[]>;
  getSystemInfo?: () => Promise<string>;
  arrangeWindow?: (appId: string, position: WindowSnapType) => { success: boolean; result: string };
}

export class GhostChatError extends Error {
  code: string;
  details?: string;

  constructor(code: string, message: string, details?: string) {
    super(message);
    this.name = 'GhostChatError';
    this.code = code;
    this.details = details;
  }
}
