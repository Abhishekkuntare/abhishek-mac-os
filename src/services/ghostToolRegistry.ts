import { APP_REGISTRY } from '../data/defaultApps';
import type {
  GhostTool,
  GhostToolCall,
  GhostToolHost,
  GhostToolResult,
} from '../types/ghostAgent';

export const GHOST_TOOLS: GhostTool[] = [
  { name: 'open_app', description: 'Open an installed ARLO OS app by its exact app id.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { app: { type: 'STRING', description: 'The exact id of an installed app.' } }, required: ['app'] } },
  { name: 'close_app', description: 'Close an open ARLO OS app.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { app: { type: 'STRING', description: 'The app id to close.' } }, required: ['app'] } },
  { name: 'create_desktop_item', description: 'Create one named file or folder on the virtual desktop.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { type: { type: 'STRING', description: 'Either file or folder.' }, name: { type: 'STRING', description: 'The exact new item name.' } }, required: ['type', 'name'] } },
  { name: 'show_desktop', description: 'Minimize visible windows and show the desktop.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: {} } },
  { name: 'get_local_time', description: 'Read the current local time and date.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: {} } },
  { name: 'get_battery_status', description: 'Read battery charge and charging state.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: {} } },
  { name: 'set_focus_mode', description: 'Enable or disable Focus Mode.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { enabled: { type: 'BOOLEAN', description: 'Whether Focus Mode should be enabled.' } }, required: ['enabled'] } },
  { name: 'open_folder', description: 'Open an existing folder in Finder.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { path: { type: 'STRING', description: 'A folder path already authorized in Finder.' } }, required: ['path'] } },
  { name: 'search_files', description: 'Search for files in authorized Finder locations.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'The file name or search terms.' } }, required: ['query'] } },
  { name: 'create_folder', description: 'Create a folder on the virtual desktop.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { name: { type: 'STRING', description: 'The new folder name.' } }, required: ['name'] } },
  { name: 'rename_file', description: 'Rename a file in an authorized location.', risk: 'MEDIUM', permission: { required: false }, parameters: { type: 'OBJECT', properties: { path: { type: 'STRING', description: 'The authorized file path.' }, new_name: { type: 'STRING', description: 'The new file name.' } }, required: ['path', 'new_name'] } },
  { name: 'move_file', description: 'Move a file between authorized locations.', risk: 'MEDIUM', permission: { required: false }, parameters: { type: 'OBJECT', properties: { source: { type: 'STRING', description: 'The authorized source path.' }, destination: { type: 'STRING', description: 'The authorized destination path.' } }, required: ['source', 'destination'] } },
  { name: 'delete_file', description: 'Move one exact file to Trash.', risk: 'HIGH', permission: { required: true, description: 'Confirm moving this file to Trash.' }, parameters: { type: 'OBJECT', properties: { path: { type: 'STRING', description: 'The exact authorized file path.' } }, required: ['path'] } },
  { name: 'open_url', description: 'Open a web address in the ARLO OS browser.', risk: 'MEDIUM', permission: { required: false }, parameters: { type: 'OBJECT', properties: { url: { type: 'STRING', description: 'An http or https URL.' } }, required: ['url'] } },
  { name: 'get_system_info', description: 'Read basic system information.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: {} } },
  { name: 'get_battery', description: 'Read the current battery status.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: {} } },
  { name: 'get_network_status', description: 'Read Wi-Fi and Bluetooth status.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: {} } },
  { name: 'get_running_processes', description: 'List running processes.', risk: 'MEDIUM', permission: { required: false }, parameters: { type: 'OBJECT', properties: {} } },
  { name: 'get_active_window', description: 'Read the currently focused ARLO OS window.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: {} } },
  { name: 'switch_workspace', description: 'Switch to an existing workspace.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { workspace: { type: 'STRING', description: 'The existing workspace name.' } }, required: ['workspace'] } },
  { name: 'create_workspace', description: 'Create a new workspace.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { name: { type: 'STRING', description: 'The new workspace name.' } }, required: ['name'] } },
  { name: 'start_project', description: 'Start a project in Code Studio.', risk: 'MEDIUM', permission: { required: false }, parameters: { type: 'OBJECT', properties: { name: { type: 'STRING', description: 'The project name.' } }, required: ['name'] } },
  { name: 'run_terminal_command', description: 'Run a terminal command. This capability is not enabled; commands require an explicit safe allow-list.', risk: 'CRITICAL', permission: { required: true, description: 'Terminal execution is not currently registered.' }, parameters: { type: 'OBJECT', properties: { command: { type: 'STRING', description: 'A command that would require explicit approval and sandboxing.' } }, required: ['command'] } },
  { name: 'take_screenshot', description: 'Capture a screenshot of the ARLO OS desktop.', risk: 'HIGH', permission: { required: true, description: 'Confirm capturing the screen.' }, parameters: { type: 'OBJECT', properties: {} } },
  { name: 'analyze_screen', description: 'Analyze a screenshot of the ARLO OS desktop.', risk: 'HIGH', permission: { required: true, description: 'Confirm sharing screen content with the configured AI service.' }, parameters: { type: 'OBJECT', properties: {} } },
  { name: 'search_clipboard', description: 'Search clipboard text.', risk: 'MEDIUM', permission: { required: false }, parameters: { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'Text to search for.' } }, required: ['query'] } },
  { name: 'change_theme', description: 'Change the ARLO OS appearance theme.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { theme: { type: 'STRING', description: 'Theme name.' } }, required: ['theme'] } },
  { name: 'enable_focus_mode', description: 'Enable Focus Mode.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: {} } },
];

type ToolOutcome = Pick<GhostToolResult, 'success' | 'result'>;
type RegisteredHandler = (args: Record<string, unknown>, host: GhostToolHost) => ToolOutcome | Promise<ToolOutcome>;

const registeredHandlers: Record<string, RegisteredHandler> = {
  open_app: (args, host) => {
    const appId = args.app;
    if (typeof appId !== 'string' || !Object.hasOwn(APP_REGISTRY, appId) || !APP_REGISTRY[appId].installed || appId === 'trash') {
      return { success: false, result: `No installed app matches "${String(appId ?? '')}".` };
    }
    const success = host.openApp(appId);
    return { success, result: success ? `${APP_REGISTRY[appId].name} opened.` : `${APP_REGISTRY[appId].name} couldn't be opened.` };
  },
  close_app: (args, host) => {
    const appId = args.app;
    if (typeof appId !== 'string' || (appId && (!Object.hasOwn(APP_REGISTRY, appId) || !APP_REGISTRY[appId].installed))) {
      return { success: false, result: `No installed app matches "${String(appId ?? '')}".` };
    }
    if (!host.closeApp) return { success: false, result: 'Closing apps is not available in this Ghost surface.' };
    const success = host.closeApp(appId);
    return { success, result: success ? `${appId ? APP_REGISTRY[appId].name : 'The focused app'} closed.` : 'That app is not open.' };
  },
  create_desktop_item: (args, host) => {
    if ((args.type !== 'file' && args.type !== 'folder') || typeof args.name !== 'string' || !args.name.trim()) {
      return { success: false, result: 'A valid file or folder type and exact name are required.' };
    }
    if (!host.createDesktopItem) return { success: false, result: 'Desktop item creation is not available in this Ghost surface.' };
    return { success: true, result: host.createDesktopItem(args.type, args.name) };
  },
  show_desktop: async (_args, host) => {
    if (!host.showDesktop) return { success: false, result: 'Showing the desktop is not available in this Ghost surface.' };
    await host.showDesktop();
    return { success: true, result: 'The desktop is visible.' };
  },
  get_local_time: (_args, host) => {
    if (!host.getLocalTime) return { success: false, result: 'Reading local time is not available in this Ghost surface.' };
    return { success: true, result: host.getLocalTime() };
  },
  get_battery_status: (_args, host) => {
    if (!host.getBatteryStatus) return { success: false, result: 'Reading battery status is not available in this Ghost surface.' };
    const battery = host.getBatteryStatus();
    if (!battery.available) return { success: true, result: 'This device does not report battery status.' };
    const charge = Math.round(battery.level);
    const state = battery.charging ? 'plugged in and charging' : battery.plugged ? 'plugged in' : 'running on battery';
    return { success: true, result: `Battery is at ${charge}% and ${state}.` };
  },
  set_focus_mode: (args, host) => {
    if (typeof args.enabled !== 'boolean' || !host.setFocusMode) {
      return { success: false, result: 'Focus Mode control is not available for this request.' };
    }
    host.setFocusMode(args.enabled);
    return { success: true, result: `Focus Mode ${args.enabled ? 'enabled' : 'disabled'}.` };
  },
};

export const executeRegisteredTool = async (
  call: GhostToolCall,
  host: GhostToolHost,
): Promise<GhostToolResult> => {
  const definition = GHOST_TOOLS.find(tool => tool.name === call.name);
  if (!definition) {
    return { id: call.id, name: call.name, success: false, result: 'This tool is not registered.' };
  }
  if (definition.risk === 'HIGH' || definition.risk === 'CRITICAL') {
    return { id: call.id, name: call.name, success: false, result: 'This high-risk action requires explicit user confirmation and is not enabled in this workflow.' };
  }
  const handler = registeredHandlers[call.name];
  if (!handler) {
    return { id: call.id, name: call.name, success: false, result: 'This registered capability is not implemented yet.' };
  }
  try {
    const outcome = await handler(call.args, host);
    return { id: call.id, name: call.name, ...outcome };
  } catch (error) {
    return {
      id: call.id,
      name: call.name,
      success: false,
      result: error instanceof Error ? error.message : 'The registered tool failed.',
    };
  }
};
