import { APP_REGISTRY } from '../data/defaultApps';
import type {
  GhostTool,
  GhostToolCall,
  GhostToolHost,
  GhostToolResult,
} from '../types/ghostAgent';
import type { WindowSnapType } from '../types/desktop';

const WINDOW_SNAP_TYPES = [
  'left',
  'right',
  'top',
  'maximize',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'left-third',
  'center-third',
  'right-third',
] as const satisfies readonly WindowSnapType[];

const isWindowSnapType = (value: string): value is WindowSnapType =>
  (WINDOW_SNAP_TYPES as readonly string[]).includes(value);

export const GHOST_TOOLS: GhostTool[] = [
  { name: 'open_app', description: 'Open an installed ARLO OS app by its exact app id.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { app: { type: 'STRING', description: 'The exact id of an installed app.' } }, required: ['app'] } },
  { name: 'close_app', description: 'Close an open ARLO OS app.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { app: { type: 'STRING', description: 'The app id to close.' } }, required: ['app'] } },
  { name: 'create_desktop_item', description: 'Create one named file or folder on the virtual desktop.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { type: { type: 'STRING', description: 'Either file or folder.' }, name: { type: 'STRING', description: 'The exact new item name.' } }, required: ['type', 'name'] } },
  { name: 'rename_desktop_item', description: 'Rename one exact item on the virtual desktop.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { name: { type: 'STRING', description: 'The exact current item name.' }, new_name: { type: 'STRING', description: 'The new item name.' } }, required: ['name', 'new_name'] } },
  { name: 'delete_desktop_item', description: 'Move one exact virtual desktop item to Trash.', risk: 'MEDIUM', permission: { required: false }, parameters: { type: 'OBJECT', properties: { name: { type: 'STRING', description: 'The exact item name to move to Trash.' } }, required: ['name'] } },
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
  { name: 'arrange_window', description: 'Snap an open ARLO OS app window to a supported screen position.', risk: 'LOW', permission: { required: false }, parameters: { type: 'OBJECT', properties: { app: { type: 'STRING', description: 'Exact id of the open installed app.' }, position: { type: 'STRING', description: 'One of left, right, top, maximize, top-left, top-right, bottom-left, bottom-right, left-third, center-third, right-third.' } }, required: ['app', 'position'] } },
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
  { name: 'take_camera_photo', description: 'Request user approval to take a photo with the enabled notch camera and save it to Photos.', risk: 'HIGH', permission: { required: true, description: 'The user must approve every photo capture.' }, parameters: { type: 'OBJECT', properties: {} } },
  { name: 'record_camera_video', description: 'Request user approval to record a short video with the enabled notch camera and save it to Photos.', risk: 'HIGH', permission: { required: true, description: 'The user must approve every video recording.' }, parameters: { type: 'OBJECT', properties: { duration_seconds: { type: 'STRING', description: 'Optional recording duration from 1 to 30 seconds; defaults to 10.' } } } },
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
  rename_desktop_item: (args, host) => {
    if (typeof args.name !== 'string' || typeof args.new_name !== 'string' || !host.renameDesktopItem) {
      return { success: false, result: 'Desktop item renaming is not available in this Ghost surface.' };
    }
    const result = host.renameDesktopItem(args.name, args.new_name);
    return { success: result !== null, result: result ?? `No desktop item named "${args.name}" was found.` };
  },
  delete_desktop_item: (args, host) => {
    if (typeof args.name !== 'string' || !host.deleteDesktopItem) {
      return { success: false, result: 'Moving desktop items to Trash is not available in this Ghost surface.' };
    }
    const result = host.deleteDesktopItem(args.name);
    return { success: result !== null, result: result ?? `No desktop item named "${args.name}" was found.` };
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
  search_files: async (args, host) => {
    if (typeof args.query !== 'string' || !args.query.trim()) return { success: false, result: 'A search term is required.' };
    if (!host.searchAuthorizedFiles) return { success: false, result: 'Searching authorized local folders is not available in this Ghost surface.' };
    const results = await host.searchAuthorizedFiles(args.query.trim());
    return { success: true, result: results.length ? results.join('\n') : 'No matching files were found in authorized folders.' };
  },
  get_system_info: async (_args, host) => {
    if (!host.getSystemInfo) return { success: false, result: 'System information is not available in this Ghost surface.' };
    return { success: true, result: await host.getSystemInfo() };
  },
  arrange_window: (args, host) => {
    if (typeof args.app !== 'string' || typeof args.position !== 'string' || !host.arrangeWindow) {
      return { success: false, result: 'Window arrangement is not available in this Ghost surface.' };
    }
    const position = args.position;
    if (!isWindowSnapType(position)) return { success: false, result: 'That window position is not supported.' };
    if (!Object.hasOwn(APP_REGISTRY, args.app) || !APP_REGISTRY[args.app].installed) {
      return { success: false, result: `No installed app matches "${args.app}".` };
    }
    return host.arrangeWindow(args.app, position);
  },
  take_camera_photo: async (_args, host) => {
    if (!host.requestCameraCapture) return { success: false, result: 'Notch camera capture is not available in this Ghost surface.' };
    return host.requestCameraCapture('photo');
  },
  record_camera_video: async (args, host) => {
    if (!host.requestCameraCapture) return { success: false, result: 'Notch camera recording is not available in this Ghost surface.' };
    const requestedDuration = args.duration_seconds === undefined ? 10 : Number(args.duration_seconds);
    if (!Number.isInteger(requestedDuration) || requestedDuration < 1 || requestedDuration > 30) {
      return { success: false, result: 'Video duration must be a whole number from 1 to 30 seconds.' };
    }
    return host.requestCameraCapture('video', requestedDuration);
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
  const hasExplicitCameraApprovalFlow = call.name === 'take_camera_photo' || call.name === 'record_camera_video';
  if ((definition.risk === 'HIGH' && !hasExplicitCameraApprovalFlow) || definition.risk === 'CRITICAL') {
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
